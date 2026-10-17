import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class BehavioralEngine:
    """
    Analyzes transaction datasets to uncover psychological and temporal spending patterns,
    detect financial anomalies using Isolation Forest, calculate a Behavioral Health Score,
    and generate personalized natural language insights.
    """

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        if not self.df.empty and 'type' in self.df.columns:
            # Filter primarily for Debit (Expense) transactions for behavioral analysis
            self.debits = self.df[self.df['type'] == 'Debit'].copy()
        else:
            self.debits = pd.DataFrame()
            
        self.anomalies = pd.DataFrame()
        self.insights = []
        self.health_score = 85

    def analyze_all(self) -> dict:
        """Executes full suite of behavioral analysis and returns structured dashboard metrics."""
        if self.debits.empty:
            return {
                'health_score': 100,
                'insights': ["Insufficient debit transaction data to analyze patterns."],
                'late_night_pct': 0,
                'weekend_ratio': 1.0,
                'impulse_count': 0,
                'total_spend': 0,
                'anomalies_count': 0
            }

        # 1. Temporal Analysis
        late_night_df, late_night_pct, late_night_food_pct = self._analyze_late_night()
        weekend_stats = self._analyze_weekend_vs_weekday()
        
        # 2. Impulse & Micro-transactions
        impulse_df, micro_tx_pct = self._analyze_impulse_and_micro()

        # 3. Subscriptions Detector
        subs_df = self._detect_recurring_subscriptions()

        # 4. Isolation Forest Anomaly Detection
        self.debits = self._detect_anomalies()
        anomaly_count = self.debits['is_anomaly'].sum() if 'is_anomaly' in self.debits.columns else 0

        # 5. Behavioral Health Score
        health_score, score_breakdown = self._calculate_health_score(
            late_night_pct, weekend_stats['multiplier'], micro_tx_pct, anomaly_count
        )
        self.health_score = health_score

        # 6. Natural Language Insight Generator
        insights = self._generate_nl_insights(
            late_night_pct, late_night_food_pct, weekend_stats, impulse_df, anomaly_count, subs_df
        )
        self.insights = insights

        return {
            'health_score': health_score,
            'score_breakdown': score_breakdown,
            'insights': insights,
            'late_night_pct': late_night_pct,
            'late_night_food_pct': late_night_food_pct,
            'weekend_ratio': weekend_stats['multiplier'],
            'impulse_count': len(impulse_df),
            'impulse_total': impulse_df['amount'].sum() if not impulse_df.empty else 0,
            'total_spend': self.debits['amount'].sum(),
            'anomalies_count': anomaly_count,
            'subscriptions_count': len(subs_df),
            'debits_df': self.debits
        }

    def _analyze_late_night(self, night_start_hour: int = 21, night_end_hour: int = 5):
        """Calculates late-night spending index (9 PM to 5 AM)."""
        df = self.debits
        if 'hour' not in df.columns:
            return pd.DataFrame(), 0.0, 0.0

        late_night_mask = (df['hour'] >= night_start_hour) | (df['hour'] <= night_end_hour)
        late_night_df = df[late_night_mask]
        
        total_spend = df['amount'].sum()
        late_night_spend = late_night_df['amount'].sum()
        late_night_pct = (late_night_spend / total_spend * 100) if total_spend > 0 else 0.0

        # Food & dining late night specific %
        food_mask = df['category'].isin(['Food & Dining', 'Grocery & Daily Needs'])
        total_food_spend = df[food_mask]['amount'].sum()
        late_food_spend = df[food_mask & late_night_mask]['amount'].sum()
        late_night_food_pct = (late_food_spend / total_food_spend * 100) if total_food_spend > 0 else 0.0

        return late_night_df, round(late_night_pct, 1), round(late_night_food_pct, 1)

    def _analyze_weekend_vs_weekday(self):
        """Calculates weekend spending acceleration ratio."""
        df = self.debits
        if 'is_weekend' not in df.columns:
            return {'multiplier': 1.0, 'weekend_avg': 0, 'weekday_avg': 0}

        weekend_df = df[df['is_weekend']]
        weekday_df = df[~df['is_weekend']]

        weekend_days = weekend_df['date'].nunique() or 1
        weekday_days = weekday_df['date'].nunique() or 1

        weekend_daily_avg = weekend_df['amount'].sum() / weekend_days
        weekday_daily_avg = weekday_df['amount'].sum() / weekday_days

        multiplier = weekend_daily_avg / weekday_daily_avg if weekday_daily_avg > 0 else 1.0

        return {
            'multiplier': round(multiplier, 2),
            'weekend_daily_avg': round(weekend_daily_avg, 2),
            'weekday_daily_avg': round(weekday_daily_avg, 2),
            'weekend_total': weekend_df['amount'].sum(),
            'weekday_total': weekday_df['amount'].sum()
        }

    def _analyze_impulse_and_micro(self, threshold_amt: float = 300.0):
        """Identifies micro-transactions and potential dopamine impulse spending sprees."""
        df = self.debits
        micro_df = df[df['amount'] <= threshold_amt]
        
        total_count = len(df)
        micro_count = len(micro_df)
        micro_tx_pct = (micro_count / total_count * 100) if total_count > 0 else 0.0

        return micro_df, round(micro_tx_pct, 1)

    def _detect_recurring_subscriptions(self):
        """Detects recurring fixed amount payments occurring regularly at the same merchant."""
        df = self.debits
        if df.empty:
            return pd.DataFrame()

        # Group by merchant and amount
        grouped = df.groupby(['merchant', 'amount']).agg(
            tx_count=('amount', 'count'),
            category=('category', 'first'),
            last_date=('timestamp', 'max')
        ).reset_index()

        recurring = grouped[grouped['tx_count'] >= 2]
        return recurring

    def _detect_anomalies(self) -> pd.DataFrame:
        """
        Uses Scikit-Learn Isolation Forest to detect statistical outliers
        (unusual amounts, unexpected off-peak hours, or unexpected merchant patterns).
        """
        df = self.debits.copy()
        if len(df) < 5:
            df['is_anomaly'] = False
            df['anomaly_score'] = 0.0
            return df

        # Prepare numerical features for ML model
        df['category_code'] = pd.Categorical(df['category']).codes
        features = df[['amount', 'hour', 'category_code']].copy()
        
        # Add is_weekend flag if available
        features['is_weekend_num'] = df['is_weekend'].astype(int)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features)

        # Fit Isolation Forest (contamination=0.08 i.e., ~8% unexpected anomalies)
        iso = IsolationForest(contamination=0.08, random_state=42)
        preds = iso.fit_predict(X_scaled)
        scores = iso.decision_function(X_scaled)

        df['is_anomaly'] = preds == -1
        df['anomaly_score'] = np.round(scores, 3)
        return df

    def _calculate_health_score(self, late_night_pct, weekend_multiplier, micro_pct, anomaly_count):
        """Calculates a holistic Financial Behavioral Health Score (0-100)."""
        score = 100.0
        deductions = {}

        # Deduction 1: Late Night Spending (>15% late night is risky)
        if late_night_pct > 35:
            ded = 20
        elif late_night_pct > 20:
            ded = 12
        elif late_night_pct > 10:
            ded = 6
        else:
            ded = 0
        score -= ded
        deductions['Late Night Splurge'] = ded

        # Deduction 2: Weekend Spending Burst (>2.0x daily average)
        if weekend_multiplier > 3.0:
            ded = 18
        elif weekend_multiplier > 2.0:
            ded = 10
        elif weekend_multiplier > 1.5:
            ded = 5
        else:
            ded = 0
        score -= ded
        deductions['Weekend Surge'] = ded

        # Deduction 3: Impulse Micro-Transactions (>40% micro)
        if micro_pct > 50:
            ded = 15
        elif micro_pct > 35:
            ded = 8
        else:
            ded = 0
        score -= ded
        deductions['Impulse Leaks'] = ded

        # Deduction 4: Anomaly Detection Flags
        anomaly_ded = min(anomaly_count * 5, 20)
        score -= anomaly_ded
        deductions['Unusual Anomalies'] = anomaly_ded

        final_score = max(int(score), 15)
        return final_score, deductions

    def _generate_nl_insights(self, late_night_pct, late_night_food_pct, weekend_stats, impulse_df, anomaly_count, subs_df):
        """Generates actionable natural language behavioral coaching points."""
        insights = []

        # Insight 1: Late Night Food Delivery
        if late_night_food_pct > 15:
            insights.append({
                'type': 'warning',
                'title': '🌙 Late-Night Food Delivery Trend',
                'text': f"**{late_night_food_pct}%** of your food & dining expenses occur after 8:00 PM. Late night delivery orders represent your primary impulse spend trigger."
            })
        else:
            insights.append({
                'type': 'positive',
                'title': '🌙 Controlled Night Expenses',
                'text': f"Only **{late_night_pct}%** of total spend happens at night. Excellent temporal spending control!"
            })

        # Insight 2: Weekend Acceleration
        mult = weekend_stats.get('multiplier', 1.0)
        if mult >= 1.8:
            insights.append({
                'type': 'warning',
                'title': '⚡ Weekend Lifestyle Acceleration',
                'text': f"You spend **{mult}x more money per day on weekends** compared to weekdays (Weekend daily avg: ₹{weekend_stats['weekend_daily_avg']:.0f} vs Weekday: ₹{weekend_stats['weekday_daily_avg']:.0f})."
            })
        else:
            insights.append({
                'type': 'info',
                'title': '⚖️ Balanced Weekend Budgeting',
                'text': f"Weekend daily spend is close to weekday average (**{mult}x** ratio)."
            })

        # Insight 3: Micro Impulse Purchases
        impulse_sum = impulse_df['amount'].sum() if not impulse_df.empty else 0
        if len(impulse_df) >= 5:
            insights.append({
                'type': 'alert',
                'title': '💸 Micro-Transaction Leaks',
                'text': f"Detected **{len(impulse_df)} small transactions** (under ₹300), accumulating to **₹{impulse_sum:,.2f}** in hidden spending leaks."
            })

        # Insight 4: ML Anomalies
        if anomaly_count > 0:
            insights.append({
                'type': 'danger',
                'title': '🚨 ML Anomaly Flagged',
                'text': f"Isolation Forest identified **{anomaly_count} unusual transaction(s)** that deviate sharply from your normal spending hour, vendor, or amount patterns."
            })

        # Insight 5: Subscriptions
        if not subs_df.empty:
            sub_names = ", ".join(subs_df['merchant'].unique()[:3])
            insights.append({
                'type': 'info',
                'title': '🔄 Recurring Fixed Commitments',
                'text': f"Detected active recurring payment patterns for: **{sub_names}**."
            })

        return insights

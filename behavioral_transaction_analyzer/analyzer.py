import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from datetime import datetime

class BehavioralAnalyzer:
    """
    Core Behavioral Analytics & Machine Learning Engine for financial transactions.
    Extracts temporal patterns, weekend surges, impulse micro-transactions, 
    ML anomaly detection, Mindful Spending Index, and personalized insights.
    """

    def __init__(self, df: pd.DataFrame, late_night_start: int = 20, micro_threshold: float = 300.0):
        self.df = df.copy()
        self.late_night_start = late_night_start  # Default 8 PM (20:00)
        self.micro_threshold = micro_threshold    # Default micro transaction limit
        self._prepare_features()

    def _prepare_features(self):
        """Prepare datetime and temporal features."""
        if self.df.empty:
            return

        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        self.df['hour'] = self.df['timestamp'].dt.hour
        self.df['day_name'] = self.df['timestamp'].dt.day_name()
        self.df['day_of_week'] = self.df['timestamp'].dt.dayofweek # 0=Monday, 6=Sunday
        self.df['is_weekend'] = self.df['day_of_week'].isin([5, 6])
        
        # Late night definition: >= late_night_start (e.g. 20:00) OR <= 5:00 AM
        self.df['is_late_night'] = (self.df['hour'] >= self.late_night_start) | (self.df['hour'] <= 5)
        self.df['is_micro'] = self.df['amount'] <= self.micro_threshold

    def get_summary_metrics(self) -> dict:
        """Returns top-level aggregate financial metrics."""
        if self.df.empty:
            return {
                'total_spend': 0.0,
                'total_txns': 0,
                'avg_txn': 0.0,
                'late_night_spend': 0.0,
                'late_night_pct': 0.0,
                'weekend_spend': 0.0
            }

        debit_df = self.df[self.df['transaction_type'] == 'Debit'] if 'transaction_type' in self.df.columns else self.df
        total_spend = debit_df['amount'].sum()
        total_txns = len(debit_df)
        avg_txn = debit_df['amount'].mean() if total_txns > 0 else 0.0
        
        late_night_df = debit_df[debit_df['is_late_night']]
        late_night_spend = late_night_df['amount'].sum()
        late_night_pct = (late_night_spend / total_spend * 100) if total_spend > 0 else 0.0

        weekend_spend = debit_df[debit_df['is_weekend']]['amount'].sum()

        return {
            'total_spend': round(total_spend, 2),
            'total_txns': total_txns,
            'avg_txn': round(avg_txn, 2),
            'late_night_spend': round(late_night_spend, 2),
            'late_night_pct': round(late_night_pct, 1),
            'weekend_spend': round(weekend_spend, 2)
        }

    def analyze_late_night_patterns(self) -> dict:
        """Analyzes late night spending behavior by category."""
        if self.df.empty:
            return {}

        debit_df = self.df[self.df['transaction_type'] == 'Debit']
        late_night_df = debit_df[debit_df['is_late_night']]

        cat_breakdown = late_night_df.groupby('category')['amount'].agg(['sum', 'count']).reset_index()
        cat_breakdown.columns = ['category', 'late_night_spend', 'count']
        
        # Calculate percentage of total spend for each category that happens late night
        total_by_cat = debit_df.groupby('category')['amount'].sum().reset_index()
        total_by_cat.columns = ['category', 'total_cat_spend']

        merged = pd.merge(cat_breakdown, total_by_cat, on='category', how='inner')
        merged['late_night_pct'] = (merged['late_night_spend'] / merged['total_cat_spend'] * 100).round(1)
        merged = merged.sort_values('late_night_spend', ascending=False)

        # Specifically calculate Food & Dining late night ratio if present
        food_late_pct = 0.0
        food_row = merged[merged['category'] == 'Food & Dining']
        if not food_row.empty:
            food_late_pct = food_row['late_night_pct'].values[0]

        return {
            'breakdown_df': merged,
            'food_late_night_pct': food_late_pct,
            'total_late_night_txns': len(late_night_df)
        }

    def analyze_weekend_vs_weekday(self) -> dict:
        """Compares daily average spend on weekends vs weekdays."""
        if self.df.empty:
            return {}

        debit_df = self.df[self.df['transaction_type'] == 'Debit'].copy()
        
        weekend_df = debit_df[debit_df['is_weekend']]
        weekday_df = debit_df[~debit_df['is_weekend']]

        weekend_days = max(weekend_df['timestamp'].dt.date.nunique(), 1)
        weekday_days = max(weekday_df['timestamp'].dt.date.nunique(), 1)

        weekend_total = weekend_df['amount'].sum()
        weekday_total = weekday_df['amount'].sum()

        weekend_avg_daily = weekend_total / weekend_days
        weekday_avg_daily = weekday_total / weekday_days

        surge_pct = (((weekend_avg_daily - weekday_avg_daily) / weekday_avg_daily) * 100) if weekday_avg_daily > 0 else 0.0

        return {
            'weekend_total': round(weekend_total, 2),
            'weekday_total': round(weekday_total, 2),
            'weekend_avg_daily': round(weekend_avg_daily, 2),
            'weekday_avg_daily': round(weekday_avg_daily, 2),
            'surge_pct': round(surge_pct, 1)
        }

    def detect_ml_anomalies(self, contamination: float = 0.04) -> pd.DataFrame:
        """
        Uses Scikit-Learn IsolationForest to detect unusual transactions 
        based on amount, hour, day of week, and category.
        """
        if len(self.df) < 5:
            self.df['is_anomaly'] = False
            self.df['anomaly_score'] = 0.0
            return self.df

        model_df = self.df.copy()
        
        # Feature encoding
        le = LabelEncoder()
        model_df['cat_encoded'] = le.fit_transform(model_df['category'])
        model_df['log_amount'] = np.log1p(model_df['amount'])

        features = ['log_amount', 'hour', 'day_of_week', 'is_weekend', 'cat_encoded']
        X = model_df[features]

        iso = IsolationForest(contamination=contamination, random_state=42)
        preds = iso.fit_predict(X) # -1 for anomaly, 1 for normal
        scores = iso.decision_function(X) # Lower score = more anomalous

        self.df['is_anomaly'] = preds == -1
        # Normalize anomaly score between 0 (normal) and 1 (highly anomalous)
        self.df['anomaly_score'] = (scores.max() - scores) / (scores.max() - scores.min() + 1e-6)

        # Generate explanation for flagged anomalies
        explanations = []
        for _, row in self.df.iterrows():
            if row['is_anomaly']:
                reasons = []
                if row['amount'] > self.df['amount'].quantile(0.90):
                    reasons.append(f"High amount (₹{row['amount']:,.2f})")
                if row['is_late_night']:
                    reasons.append(f"Odd hour ({row['hour']:02d}:00)")
                if not reasons:
                    reasons.append("Unusual spending pattern for category")
                explanations.append(", ".join(reasons))
            else:
                explanations.append("Normal")

        self.df['anomaly_reason'] = explanations
        return self.df

    def calculate_mindful_spending_index(self) -> dict:
        """
        Calculates a Mindful Spending Index (0 to 100) based on behavioral indicators.
        """
        if self.df.empty:
            return {'score': 100, 'rating': 'Mindful Saver', 'deductions': []}

        score = 100
        deductions = []

        late_night_res = self.analyze_late_night_patterns()
        weekend_res = self.analyze_weekend_vs_weekday()

        # 1. Late night food penalty
        food_late_pct = late_night_res.get('food_late_night_pct', 0)
        if food_late_pct > 50:
            ded = 15
            score -= ded
            deductions.append(f"-{ded} pts: High late-night food ordering ({food_late_pct:.1f}% after 8 PM)")
        elif food_late_pct > 30:
            ded = 8
            score -= ded
            deductions.append(f"-{ded} pts: Moderate late-night food ordering ({food_late_pct:.1f}% after 8 PM)")

        # 2. Weekend surge penalty
        surge_pct = weekend_res.get('surge_pct', 0)
        if surge_pct > 75:
            ded = 15
            score -= ded
            deductions.append(f"-{ded} pts: Severe weekend spending surge (+{surge_pct:.1f}% vs weekdays)")
        elif surge_pct > 35:
            ded = 8
            score -= ded
            deductions.append(f"-{ded} pts: Moderate weekend surge (+{surge_pct:.1f}% vs weekdays)")

        # 3. Micro transaction frequency
        micro_count = len(self.df[self.df['is_micro']])
        if micro_count > 30:
            ded = 12
            score -= ded
            deductions.append(f"-{ded} pts: Frequent micro impulse purchases ({micro_count} transactions < ₹{self.micro_threshold:.0f})")

        # 4. ML Anomalies penalty
        if 'is_anomaly' in self.df.columns:
            anom_count = len(self.df[self.df['is_anomaly']])
            if anom_count > 0:
                ded = min(anom_count * 5, 20)
                score -= ded
                deductions.append(f"-{ded} pts: ML detected {anom_count} unusual transaction anomalies")

        score = max(0, min(100, score))

        if score >= 85:
            rating = "🟢 Mindful Saver"
            description = "Excellent spending discipline with minimal impulse leaks."
        elif score >= 70:
            rating = "🟡 Balanced Consumer"
            description = "Healthy overall spending, with minor late-night or weekend splurges."
        elif score >= 50:
            rating = "🟠 Impulsive Splurger"
            description = "Noticeable behavioral leaks in late-night food orders and weekend surges."
        else:
            rating = "🔴 High Behavioral Leakage"
            description = "Significant impulse spending, micro-drains, and unusual transactions detected."

        return {
            'score': score,
            'rating': rating,
            'description': description,
            'deductions': deductions
        }

    def generate_personalized_insights(self) -> list:
        """
        Generates dynamic natural-language behavioral insights based on analyzed data.
        """
        insights = []
        if self.df.empty:
            return ["No transaction data available to generate insights."]

        metrics = self.get_summary_metrics()
        late_night_res = self.analyze_late_night_patterns()
        weekend_res = self.analyze_weekend_vs_weekday()

        # Insight 1: Late Night Food Delivery
        food_late_pct = late_night_res.get('food_late_night_pct', 0)
        breakdown_df = late_night_res.get('breakdown_df', pd.DataFrame())
        if not breakdown_df.empty and food_late_pct > 0:
            food_row = breakdown_df[breakdown_df['category'] == 'Food & Dining']
            if not food_row.empty:
                food_spent = food_row['late_night_spend'].values[0]
                insights.append(
                    f"🌙 **Late-Night Food Habit**: **{food_late_pct:.0f}%** of your food-delivery spending occurs after 8:00 PM (Totaling **₹{food_spent:,.2f}**)."
                )

        # Insight 2: Weekend vs Weekday Surge
        surge_pct = weekend_res.get('surge_pct', 0)
        weekend_avg = weekend_res.get('weekend_avg_daily', 0)
        weekday_avg = weekend_res.get('weekday_avg_daily', 0)
        if surge_pct > 15:
            insights.append(
                f"🎉 **Weekend Spending Surge**: Your daily spending on weekends (**₹{weekend_avg:,.2f}/day**) is **{surge_pct:.0f}% higher** than on weekdays (**₹{weekday_avg:,.2f}/day**)."
            )
        elif surge_pct < -15:
            insights.append(
                f"💼 **Weekday Dominant**: Your weekday spending (**₹{weekday_avg:,.2f}/day**) is higher than weekend spending (**₹{weekend_avg:,.2f}/day**)."
            )

        # Insight 3: Micro Impulse Purchases
        micro_df = self.df[self.df['is_micro']]
        if len(micro_df) >= 5:
            total_micro_spend = micro_df['amount'].sum()
            top_micro_cat = micro_df['category'].mode()[0] if not micro_df.empty else "Quick Commerce"
            insights.append(
                f"⚡ **Impulse Micro-Drains**: You made **{len(micro_df)} small purchases** under ₹{self.micro_threshold:.0f}, totaling **₹{total_micro_spend:,.2f}** (Mostly in *{top_micro_cat}*)."
            )

        # Insight 4: ML Anomalies
        if 'is_anomaly' in self.df.columns:
            anom_df = self.df[self.df['is_anomaly']]
            if not anom_df.empty:
                anom_total = anom_df['amount'].sum()
                highest_anom = anom_df.loc[anom_df['amount'].idxmax()]
                insights.append(
                    f"⚠️ **Unusual Transactions Flagged**: ML detected **{len(anom_df)} abnormal transactions** worth **₹{anom_total:,.2f}**, e.g., **₹{highest_anom['amount']:,.2f}** at *{highest_anom['merchant']}* ({highest_anom['hour']:02d}:00)."
                )

        # Insight 5: Category Dominance
        top_cat = self.df.groupby('category')['amount'].sum().idxmax()
        top_cat_amount = self.df.groupby('category')['amount'].sum().max()
        top_cat_pct = (top_cat_amount / metrics['total_spend'] * 100) if metrics['total_spend'] > 0 else 0
        insights.append(
            f"📊 **Dominant Category**: **{top_cat}** represents your largest financial commitment at **{top_cat_pct:.1f}%** of total spend (**₹{top_cat_amount:,.2f}**)."
        )

        return insights

# 🧠 Behavioral Transaction Analyzer

An AI-based financial analyzer system that turns raw transaction SMS notifications and bank alerts into psychological spending patterns, temporal triggers, and statistical anomaly alerts—moving beyond generic category expense tracking.

---

## 🌟 Key Features

1. **📱 NLP & Regex Notification Parser**
   - Automatically parses key parameters from raw SMS notifications (HDFC, SBI, ICICI, Swiggy, Paytm, GPay, Uber, Credit Cards, etc.).
   - Extracts: `Amount`, `Currency`, `Merchant/Payee`, `Transaction Type (Debit/Credit)`, `Payment Mode (UPI/Card/NetBanking)`, `Date & Time`.

2. **🏷️ Hybrid Keyword + ML Categorization Engine**
   - Direct regex dictionary matching for known brands (Swiggy, Uber, Netflix, Starbucks, Amazon, Blinkit, etc.).
   - TF-IDF + Naive Bayes ML classifier fallback for uncategorized or ambiguous merchants.

3. **⏰ Temporal Behavioral Analytics**
   - **Late-Night Spending Index**: Highlights splurges between 9:00 PM and 5:00 AM (e.g. food delivery impulsivity).
   - **Weekend Surge Multiplier**: Calculates weekend daily spending acceleration vs. weekday baseline.
   - **Payday Velocity**: Tracks post-salary budget depletion rates.

4. **💸 Micro-Transaction & Impulse Leak Detector**
   - Detects frequency and accumulated totals of small impulse purchases (< ₹300).
   - Highlights phantom spending leaks that erode monthly savings.

5. **🤖 Unsupervised ML Anomaly Detection (Isolation Forest)**
   - Uses Scikit-Learn `IsolationForest` on feature vectors `[amount, hour, category, weekend]` to catch statistical outliers (e.g. unexpected off-hour large transactions).

6. **🛡️ Financial Behavioral Health Score (0-100)**
   - Algorithmic discipline score computed by penalizing late-night splurging, weekend spikes, impulse frequency, and anomaly flags.

7. **💡 Natural Language Insight Generator**
   - Translates raw numbers into human-readable behavioral insights:
     - *"63.4% of your food-delivery spending occurs after 8:00 PM."*
     - *"Weekend Surge: You spend 2.4x more per day on weekends than on weekdays."*
     - *"Impulse Alert: 10 micro-purchases under ₹300 added up to ₹2,400 in hidden leaks."*

8. **📊 Interactive Streamlit Visual Dashboard**
   - Executive Summary Gauge & Metric Badges
   - Late-Night Hour vs. Day-of-Week Plotly Heatmap
   - ML Anomaly Scatter Plot
   - Live SMS Sandbox / Testing Simulator
   - Full Filterable Transaction Data Explorer & CSV Exporter

---

## 🛠️ Architecture & Tech Stack

- **Core Language**: Python 3.9+
- **Data Engine & Analytics**: Pandas, NumPy
- **Machine Learning & NLP**: Scikit-Learn (TF-IDF, Naive Bayes, Isolation Forest), Regex
- **Visualization & UI**: Streamlit, Plotly Express & Graph Objects

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Streamlit Dashboard
```bash
streamlit run app.py
```

### 3. Open in Browser
Navigate to `http://localhost:8501` to view the interactive dashboard.

---

## 📁 Project Structure

```
behavioral_transaction_analyzer/
├── app.py                # Main Streamlit Dashboard UI & Layout
├── parser.py             # NLP & Regex SMS Parser
├── categorizer.py        # Hybrid Categorization Engine (Regex + TF-IDF)
├── behavioral_engine.py  # Behavioral Analytics, Isolation Forest & Health Score
├── sample_data.py        # Realistic Bank SMS Notification Generator
├── requirements.txt      # Python Dependencies List
└── README.md             # Project Documentation
```

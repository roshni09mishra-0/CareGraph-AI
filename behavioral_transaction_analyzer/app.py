import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from parser import TransactionSMSParser
from analyzer import BehavioralAnalyzer
from sample_data import generate_sample_behavioral_dataset, get_sample_raw_sms_text

# Page Config
st.set_page_config(
    page_title="Behavioral Transaction Analyzer",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #6B7280;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .insight-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border-left: 4px solid #8B5CF6;
        border-radius: 8px;
        padding: 1rem 1.2rem;
        margin-bottom: 0.8rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 6px 6px 0px 0px;
    }
</style>
""", unsafe_allow_html=True)

# Application Title Header
st.markdown('<div class="main-header">🧠 Behavioral Transaction Analyzer</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Transform raw transaction notifications into behavioral patterns, impulse detection, and ML anomaly insights.</div>', unsafe_allow_html=True)

# Sidebar Configuration
st.sidebar.image("https://img.icons8.com/isometric-folders/100/brain.png", width=70)
st.sidebar.title("⚙️ Controls & Data Source")

data_source = st.sidebar.radio(
    "Select Data Input Source:",
    ["🟢 Demo Behavioral Dataset", "📥 Upload CSV / SMS File", "✍️ Paste Raw SMS Text"]
)

# Load Data based on selection
df_raw = pd.DataFrame()

if data_source == "🟢 Demo Behavioral Dataset":
    df_raw = generate_sample_behavioral_dataset()
    st.sidebar.success("Loaded synthetic dataset with 150+ realistic behavioral transactions.")

elif data_source == "📥 Upload CSV / SMS File":
    uploaded_file = st.sidebar.file_uploader("Upload CSV or TXT file", type=["csv", "txt"])
    if uploaded_file is not None:
        if uploaded_file.name.endswith('.csv'):
            try:
                df_uploaded = pd.read_csv(uploaded_file)
                # Check if raw_sms column exists or parsed columns exist
                if 'raw_sms' in df_uploaded.columns:
                    full_text = "\n".join(df_uploaded['raw_sms'].dropna().astype(str))
                    df_raw = TransactionSMSParser.parse_batch_sms(full_text)
                elif all(col in df_uploaded.columns for col in ['timestamp', 'amount', 'merchant', 'category']):
                    df_raw = df_uploaded
                    df_raw['timestamp'] = pd.to_datetime(df_raw['timestamp'])
                else:
                    st.error("Uploaded CSV missing required columns. Must contain either 'raw_sms' or standard transaction columns.")
            except Exception as e:
                st.error(f"Error reading file: {e}")
        else:
            # Plain text file with SMS
            content = uploaded_file.read().decode('utf-8')
            df_raw = TransactionSMSParser.parse_batch_sms(content)

elif data_source == "✍️ Paste Raw SMS Text":
    sample_text = get_sample_raw_sms_text()
    user_sms_block = st.sidebar.text_area("Paste Transaction SMS Notifications:", value=sample_text, height=180)
    if user_sms_block:
        df_raw = TransactionSMSParser.parse_batch_sms(user_sms_block)
        st.sidebar.info(f"Parsed {len(df_raw)} transactions from text block.")

if df_raw.empty:
    st.warning("⚠️ No data loaded or parsed yet. Please select a valid data source from the sidebar.")
    st.stop()

# Sidebar Behavioral Settings
st.sidebar.markdown("---")
st.sidebar.subheader("🔍 Behavioral Settings")
late_night_start = st.sidebar.slider("Late-Night Start Hour (24-hr):", min_value=18, max_value=23, value=20, help="Hour after which spending is considered late night (e.g. 20 = 8 PM)")
micro_limit = st.sidebar.number_input("Micro-Transaction Threshold (₹):", min_value=50, max_value=1000, value=300, step=50)
anomaly_contamination = st.sidebar.slider("ML Anomaly Sensitivity:", min_value=0.01, max_value=0.10, value=0.04, step=0.01)

# Apply Sidebar Filters
st.sidebar.markdown("---")
st.sidebar.subheader("🎯 Filters")
min_date = df_raw['timestamp'].min().date()
max_date = df_raw['timestamp'].max().date()
selected_dates = st.sidebar.date_input("Date Range:", value=(min_date, max_date), min_value=min_date, max_value=max_date)

categories = list(df_raw['category'].unique())
selected_categories = st.sidebar.multiselect("Filter Categories:", options=categories, default=categories)

# Filter Dataframe
df_filtered = df_raw.copy()
if isinstance(selected_dates, tuple) and len(selected_dates) == 2:
    start_dt = pd.to_datetime(selected_dates[0])
    end_dt = pd.to_datetime(selected_dates[1]) + pd.Timedelta(days=1)
    df_filtered = df_filtered[(df_filtered['timestamp'] >= start_dt) & (df_filtered['timestamp'] < end_dt)]

if selected_categories:
    df_filtered = df_filtered[df_filtered['category'].isin(selected_categories)]

# Initialize Analyzer
analyzer = BehavioralAnalyzer(df_filtered, late_night_start=late_night_start, micro_threshold=micro_limit)
analyzer.detect_ml_anomalies(contamination=anomaly_contamination)

summary_metrics = analyzer.get_summary_metrics()
mindful_res = analyzer.calculate_mindful_spending_index()
insights = analyzer.generate_personalized_insights()

# Dashboard Top Overview Metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("💸 Total Spend", f"₹{summary_metrics['total_spend']:,.2f}", delta=f"{summary_metrics['total_txns']} Txns")

with col2:
    st.metric("🌙 Late-Night Spend", f"₹{summary_metrics['late_night_spend']:,.2f}", delta=f"{summary_metrics['late_night_pct']}% of Total", delta_color="inverse")

with col3:
    st.metric("⚡ Micro Purchases", f"{len(df_filtered[df_filtered['is_micro']])}", delta=f"< ₹{micro_limit}")

with col4:
    st.metric("🧠 Mindful Score", f"{mindful_res['score']}/100", delta=mindful_res['rating'])

st.markdown("---")

# Main Interactive Tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "💡 Behavioral Insights", 
    "📈 Deep Analytics", 
    "🤖 ML Anomaly Detector", 
    "📋 Raw Transactions", 
    "🧪 Live SMS Tester"
])

# Tab 1: Behavioral Insights & Mindful Score
with tab1:
    col_left, col_right = st.columns([1, 1])
    
    with col_left:
        st.subheader("🎯 Mindful Spending Index")
        st.markdown(f"### Score: **{mindful_res['score']}/100** — {mindful_res['rating']}")
        st.caption(mindful_res['description'])
        
        # Display Gauge Chart
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = mindful_res['score'],
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Financial Habit Health", 'font': {'size': 18}},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': "#8B5CF6"},
                'steps': [
                    {'range': [0, 50], 'color': "#EF4444"},
                    {'range': [50, 70], 'color': "#F59E0B"},
                    {'range': [70, 85], 'color': "#3B82F6"},
                    {'range': [85, 100], 'color': "#10B981"}
                ]
            }
        ))
        fig_gauge.update_layout(height=240, margin=dict(l=20, r=20, t=30, b=20), paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_gauge, use_container_width=True)

        if mindful_res['deductions']:
            st.markdown("**Deduction Factors:**")
            for ded in mindful_res['deductions']:
                st.markdown(f"- `{ded}`")
        else:
            st.success("No behavioral penalties detected! Keep up the great financial discipline.")

    with col_right:
        st.subheader("🗣️ Personalized Behavioral Insights")
        st.caption("AI extracted insights from your time-of-day, weekend trends, and merchant frequency:")
        
        for ins in insights:
            st.markdown(f"""
            <div class="insight-card">
                {ins}
            </div>
            """, unsafe_allow_html=True)

    st.markdown("---")
    st.subheader("💡 Behavioral Nudges & Action Recommendations")
    
    col_rec1, col_rec2, col_rec3 = st.columns(3)
    late_res = analyzer.analyze_late_night_patterns()
    weekend_res = analyzer.analyze_weekend_vs_weekday()

    with col_rec1:
        st.info("🌙 **Late-Night Ordering Cutoff**\n\nSet a food delivery app lock or alarm at **8:30 PM**. Restricting late-night ordering can save up to **30%** of monthly food expenses.")

    with col_rec2:
        st.warning("🎉 **Weekend Splurge Budget**\n\nAllocate a fixed pre-paid weekend wallet limit to curb impulse spending during Friday-Sunday shopping and dining.")

    with col_rec3:
        st.success("⚡ **Micro-Drain Consolidation**\n\nReview small recurring subscriptions and daily quick-commerce orders (< ₹300). Batching grocery orders saves delivery fees and impulse additions.")

# Tab 2: Deep Analytics
with tab2:
    st.subheader("📈 Time-of-Day & Weekend Spending Breakdown")
    
    col_a, col_b = st.columns(2)

    with col_a:
        st.markdown("##### 🕒 Hourly Spending Distribution")
        hourly_df = analyzer.df.groupby('hour')['amount'].sum().reset_index()
        hourly_df['is_late'] = (hourly_df['hour'] >= late_night_start) | (hourly_df['hour'] <= 5)
        
        fig_hour = px.bar(
            hourly_df, x='hour', y='amount',
            color='is_late',
            color_discrete_map={True: '#8B5CF6', False: '#3B82F6'},
            labels={'hour': 'Hour of Day (0-23)', 'amount': 'Total Spend (₹)', 'is_late': 'Late Night'},
            title="Total Spend by Hour of Day"
        )
        fig_hour.update_layout(xaxis=dict(tickmode='linear', tick0=0, dtick=2))
        st.plotly_chart(fig_hour, use_container_width=True)

    with col_b:
        st.markdown("##### 🌙 Late-Night Spend Category Breakdown")
        late_df = analyzer.df[analyzer.df['is_late_night']]
        if not late_df.empty:
            fig_pie = px.pie(
                late_df, names='category', values='amount',
                hole=0.4,
                title=f"Late-Night Spending Breakdown (After {late_night_start}:00)",
                color_discrete_sequence=px.colors.sequential.Darkmint
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        else:
            st.info("No late night spending recorded.")

    st.markdown("---")
    col_c, col_d = st.columns(2)

    with col_c:
        st.markdown("##### 🗓️ Weekend vs. Weekday Daily Average")
        wknd_res = analyzer.analyze_weekend_vs_weekday()
        wknd_df = pd.DataFrame([
            {'Type': 'Weekday Avg / Day', 'Amount': wknd_res['weekday_avg_daily']},
            {'Type': 'Weekend Avg / Day', 'Amount': wknd_res['weekend_avg_daily']}
        ])
        fig_wknd = px.bar(
            wknd_df, x='Type', y='Amount', color='Type',
            color_discrete_sequence=['#3B82F6', '#EF4444'],
            title=f"Weekend Surge ({wknd_res['surge_pct']}% higher)"
        )
        st.plotly_chart(fig_wknd, use_container_width=True)

    with col_d:
        st.markdown("##### 🏷️ Category Spending Distribution")
        cat_df = analyzer.df.groupby('category')['amount'].sum().reset_index().sort_values('amount', ascending=True)
        fig_cat = px.bar(
            cat_df, y='category', x='amount', orientation='h',
            color='amount', color_continuous_scale='Blues',
            title="Total Spend per Category"
        )
        st.plotly_chart(fig_cat, use_container_width=True)

# Tab 3: ML Anomaly Detector
with tab3:
    st.subheader("🤖 Machine Learning Anomaly Detection (Isolation Forest)")
    st.caption("Unsupervised Machine Learning flags transactions with unusual combinations of amount, time of day, day of week, and category.")

    anom_df = analyzer.df[analyzer.df['is_anomaly']]
    
    col_m1, col_m2 = st.columns([2, 1])

    with col_m1:
        fig_scatter = px.scatter(
            analyzer.df,
            x='hour',
            y='amount',
            color='is_anomaly',
            size='amount',
            hover_data=['merchant', 'category', 'timestamp', 'anomaly_reason'],
            color_discrete_map={True: '#EF4444', False: '#10B981'},
            labels={'is_anomaly': 'ML Flagged Anomaly', 'hour': 'Hour of Day (0-23)', 'amount': 'Amount (₹)'},
            title="Transaction Amount vs Hour of Day (Anomalies Highlighted in Red)"
        )
        fig_scatter.update_layout(xaxis=dict(tickmode='linear', tick0=0, dtick=2))
        st.plotly_chart(fig_scatter, use_container_width=True)

    with col_m2:
        st.markdown(f"#### ⚠️ Flagged Anomalies ({len(anom_df)})")
        if not anom_df.empty:
            for idx, row in anom_df.iterrows():
                st.error(f"""
                **₹{row['amount']:,.2f}** at **{row['merchant']}**  
                📅 {row['timestamp'].strftime('%d %b %Y, %I:%M %p')}  
                🏷️ Category: {row['category']}  
                🔍 Reason: *{row['anomaly_reason']}*
                """)
        else:
            st.success("No anomalies detected at current sensitivity setting.")

# Tab 4: Raw Transactions
with tab4:
    st.subheader("📋 Searchable Parsed Transaction Ledger")
    
    # Filter search term
    search_term = st.text_input("🔍 Search payee, merchant, or raw text:", "")
    
    display_df = analyzer.df.copy()
    if search_term:
        display_df = display_df[
            display_df['merchant'].str.contains(search_term, case=False, na=False) |
            display_df['raw_sms'].str.contains(search_term, case=False, na=False) |
            display_df['category'].str.contains(search_term, case=False, na=False)
        ]

    st.dataframe(
        display_df[['timestamp', 'amount', 'merchant', 'category', 'transaction_type', 'payment_channel', 'is_late_night', 'is_anomaly']],
        use_container_width=True,
        height=400
    )

    csv_data = display_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Export Clean Parsed Data as CSV",
        data=csv_data,
        file_name="behavioral_transactions_parsed.csv",
        mime="text/csv"
    )

# Tab 5: Live SMS Tester
with tab5:
    st.subheader("🧪 Live SMS Parser & NLP Tester")
    st.caption("Test individual bank transaction SMS notifications to verify NLP regex extraction.")

    sample_test_sms = "Paid Rs.1,850.00 to Zomato online order on 01-Oct-2026 23:15 using UPI ref 94810293."
    test_input = st.text_area("Enter a sample SMS notification string:", value=sample_test_sms, height=100)
    
    if st.button("Parse SMS Now"):
        parsed_result = TransactionSMSParser.parse_single_sms(test_input)
        if parsed_result:
            st.success("Successfully Parsed Transaction SMS!")
            col_t1, col_t2 = st.columns(2)
            with col_t1:
                st.json({
                    'Amount': f"₹{parsed_result['amount']:,.2f}",
                    'Merchant / Payee': parsed_result['merchant'],
                    'Expense Category': parsed_result['category'],
                    'Transaction Type': parsed_result['transaction_type']
                })
            with col_t2:
                st.json({
                    'Timestamp': parsed_result['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                    'Payment Channel': parsed_result['payment_channel'],
                    'Raw Input': parsed_result['raw_sms']
                })
        else:
            st.error("Could not parse valid transaction details from the input string.")

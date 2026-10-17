import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from sms_parser import TransactionSMSParser
from categorizer import TransactionCategorizer
from behavioral_engine import BehavioralEngine
from sample_data import get_sample_sms_dataset

# ---------------------------------------------------------
# Page Configuration & UI Theme Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Behavioral Transaction Analyzer",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for glassmorphism, dark aesthetics, and metrics badges
st.markdown("""
    <style>
    /* Global Container Adjustments */
    .stApp {
        background-color: #0e1117;
        color: #e0e6ed;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    /* Header Card */
    .header-box {
        background: linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #4c1d95 100%);
        border-radius: 16px;
        padding: 24px 32px;
        color: #ffffff;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        margin-bottom: 25px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .header-box h1 {
        color: #ffffff;
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 6px;
    }
    .header-box p {
        color: #cbd5e1;
        font-size: 1.05rem;
        margin-bottom: 0;
    }
    
    /* Stat Cards */
    .metric-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 18px 20px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        backdrop-filter: blur(8px);
    }
    .metric-title {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-weight: 600;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 6px 0;
    }
    .metric-sub {
        font-size: 0.8rem;
        color: #38bdf8;
    }

    /* Insight Banner Boxes */
    .insight-box {
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 12px;
        border-left: 5px solid;
    }
    .insight-warning {
        background: rgba(234, 179, 8, 0.12);
        border-color: #eab308;
        color: #fef08a;
    }
    .insight-positive {
        background: rgba(34, 197, 94, 0.12);
        border-color: #22c55e;
        color: #bbf7d0;
    }
    .insight-alert {
        background: rgba(249, 115, 22, 0.12);
        border-color: #f97316;
        color: #fed7aa;
    }
    .insight-danger {
        background: rgba(239, 68, 68, 0.12);
        border-color: #ef4444;
        color: #fca5a5;
    }
    .insight-info {
        background: rgba(56, 189, 248, 0.12);
        border-color: #38bdf8;
        color: #bae6fd;
    }
    .insight-title {
        font-weight: 700;
        font-size: 1.05rem;
        margin-bottom: 4px;
    }

    /* Streamlit Tab Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: rgba(15, 23, 42, 0.6);
        padding: 8px;
        border-radius: 12px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 10px 18px;
        color: #94a3b8;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        background-color: #4f46e5 !important;
        color: #ffffff !important;
    }
    </style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Session State & Initial Data Processing Setup
# ---------------------------------------------------------
if 'sms_list' not in st.session_state:
    st.session_state.sms_list = get_sample_sms_dataset()

@st.cache_data
def process_sms_dataset(sms_list):
    """Parses and categorizes SMS data."""
    raw_df = TransactionSMSParser.parse_batch_sms(sms_list)
    if raw_df.empty:
        return pd.DataFrame()
    
    categorizer = TransactionCategorizer()
    df_categorized = categorizer.categorize_dataframe(raw_df)
    return df_categorized

# Render Header
st.markdown("""
    <div class="header-box">
        <h1>🧠 Behavioral Transaction Analyzer</h1>
        <p>AI & NLP analysis turning raw bank SMS notifications into psychological spending patterns, temporal triggers, and anomaly alerts.</p>
    </div>
""", unsafe_allow_html=True)

# Load processed data
processed_df = process_sms_dataset(st.session_state.sms_list)

if processed_df.empty:
    st.error("No valid transaction data loaded. Please add transaction SMS notifications in the Simulator tab.")
    st.stop()

# Initialize Behavioral Engine
engine = BehavioralEngine(processed_df)
analysis_results = engine.analyze_all()
debits_df = analysis_results['debits_df']

# ---------------------------------------------------------
# Sidebar Controls & Data Ingestion Options
# ---------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/isometric-folders/100/brain.png", width=70)
    st.title("Analyzer Control")
    
    st.subheader("📊 Data Source")
    data_mode = st.radio(
        "Select Mode:",
        ["Sample Bank Notifications", "Paste Custom SMS Text"],
        help="Switch between demo pre-loaded dataset or paste raw notifications."
    )
    
    if data_mode == "Paste Custom SMS Text":
        custom_input = st.text_area(
            "Paste raw SMS notifications (one per line):",
            height=150,
            placeholder="Spent Rs. 540.00 at Swiggy on 12-Sep-24 at 10:45 PM..."
        )
        if st.button("🔄 Analyze Custom Data", use_container_state=True):
            lines = [line.strip() for line in custom_input.split('\n') if line.strip()]
            if lines:
                st.session_state.sms_list = lines
                st.rerun()
            else:
                st.warning("Please paste at least one valid notification string.")

    if st.button("♻️ Reset Sample Dataset", use_container_state=True):
        st.session_state.sms_list = get_sample_sms_dataset()
        st.rerun()

    st.markdown("---")
    st.subheader("⚙️ Analysis Thresholds")
    night_hour_threshold = st.slider("Late Night Start Hour (PM):", 20, 23, 21, help="Hour of night when spending is flagged as late-night.")
    micro_threshold = st.number_input("Micro-transaction Cap (₹):", min_value=50, max_value=2000, value=300, step=50)

# ---------------------------------------------------------
# Top Key Executive Metrics Row
# ---------------------------------------------------------
col1, col2, col3, col4, col5 = st.columns(5)

total_expense = analysis_results['total_spend']
health_score = analysis_results['health_score']
late_night_pct = analysis_results['late_night_pct']
weekend_ratio = analysis_results['weekend_ratio']
anomalies_count = analysis_results['anomalies_count']

with col1:
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Total Spending</div>
            <div class="metric-value">₹{total_expense:,.0f}</div>
            <div class="metric-sub">{len(debits_df)} Debit Txns</div>
        </div>
    """, unsafe_allow_html=True)

with col2:
    health_color = "#22c55e" if health_score >= 80 else ("#eab308" if health_score >= 60 else "#ef4444")
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Behavioral Health</div>
            <div class="metric-value" style="color: {health_color};">{health_score} / 100</div>
            <div class="metric-sub">Financial Discipline Score</div>
        </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Late-Night Spend</div>
            <div class="metric-value" style="color: #f59e0b;">{late_night_pct}%</div>
            <div class="metric-sub">After 9:00 PM</div>
        </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Weekend Multiplier</div>
            <div class="metric-value" style="color: #a855f7;">{weekend_ratio}x</div>
            <div class="metric-sub">Vs. Weekday Daily Avg</div>
        </div>
    """, unsafe_allow_html=True)

with col5:
    anom_color = "#ef4444" if anomalies_count > 0 else "#22c55e"
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">ML Anomalies</div>
            <div class="metric-value" style="color: {anom_color};">{anomalies_count}</div>
            <div class="metric-sub">Isolation Forest Flags</div>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ---------------------------------------------------------
# Navigation Tabs
# ---------------------------------------------------------
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "🧠 Overview & Health Score",
    "🕵️‍♂️ Behavioral Pattern Deep-Dive",
    "🚨 ML Anomaly & Impulse Leak Detector",
    "📱 SMS Parser & Live Simulator",
    "📑 Filterable Transaction Explorer"
])

# =========================================================
# TAB 1: OVERVIEW & HEALTH SCORE
# =========================================================
with tab1:
    col_left, col_right = st.columns([1.2, 1])

    with col_left:
        st.subheader("💡 Behavioral Insights & Coaching Prompts")
        insights = analysis_results.get('insights', [])
        
        for ins in insights:
            box_class = f"insight-{ins.get('type', 'info')}"
            st.markdown(f"""
                <div class="insight-box {box_class}">
                    <div class="insight-title">{ins['title']}</div>
                    <div>{ins['text']}</div>
                </div>
            """, unsafe_allow_html=True)

    with col_right:
        st.subheader("🛡️ Behavioral Health Score Breakdown")
        
        # Gauge Chart for Health Score
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = health_score,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Health Score", 'font': {'size': 18, 'color': "#cbd5e1"}},
            number = {'font': {'size': 44, 'color': health_color}},
            gauge = {
                'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "#475569"},
                'bar': {'color': health_color},
                'bgcolor': "rgba(30, 41, 59, 0.5)",
                'bordercolor': "rgba(255, 255, 255, 0.1)",
                'steps': [
                    {'range': [0, 50], 'color': 'rgba(239, 68, 68, 0.3)'},
                    {'range': [50, 75], 'color': 'rgba(234, 179, 8, 0.3)'},
                    {'range': [75, 100], 'color': 'rgba(34, 197, 94, 0.3)'}
                ],
            }
        ))
        fig_gauge.update_layout(
            height=250,
            margin=dict(l=20, r=20, t=30, b=20),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig_gauge, use_container_state=True)

        # Score Deductions Breakdown Table
        st.markdown("**Score Penalties Applied:**")
        score_breakdown = analysis_results.get('score_breakdown', {})
        for factor, penalty in score_breakdown.items():
            if penalty > 0:
                st.markdown(f"- ⚠️ **{factor}**: -{penalty} pts penalty")
            else:
                st.markdown(f"- ✅ **{factor}**: No penalty (Healthy)")

    st.markdown("---")
    st.subheader("📈 Cumulative Spending & Velocity")
    
    # Time Series Velocity Plot
    if not debits_df.empty:
        df_sorted = debits_df.sort_values('timestamp')
        df_sorted['cumulative_spend'] = df_sorted['amount'].cumsum()
        
        fig_timeline = px.area(
            df_sorted,
            x='timestamp',
            y='cumulative_spend',
            title="Cumulative Outflow Velocity over Time (₹)",
            labels={'cumulative_spend': 'Cumulative Spend (₹)', 'timestamp': 'Date & Time'},
            color_discrete_sequence=['#818cf8']
        )
        fig_timeline.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(15, 23, 42, 0.5)',
            font_color='#cbd5e1',
            height=320
        )
        st.plotly_chart(fig_timeline, use_container_state=True)

# =========================================================
# TAB 2: BEHAVIORAL PATTERN DEEP-DIVE
# =========================================================
with tab2:
    st.subheader("🌙 Late-Night Spending Heatmap (Hour vs Day of Week)")
    st.caption("Highlights specific time windows when emotional / impulse splurging occurs.")

    if not debits_df.empty:
        # Create pivot table for Hour vs Day of Week
        days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_data = debits_df.groupby(['day_of_week', 'hour'])['amount'].sum().unstack(fill_value=0)
        heatmap_data = heatmap_data.reindex(days_order).fillna(0)

        fig_heat = px.imshow(
            heatmap_data,
            labels=dict(x="Hour of Day (0-23)", y="Day of Week", color="Spend (₹)"),
            x=heatmap_data.columns,
            y=heatmap_data.index,
            color_continuous_scale="Viridis",
            aspect="auto"
        )
        fig_heat.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#cbd5e1',
            height=350
        )
        st.plotly_chart(fig_heat, use_container_state=True)

    st.markdown("---")
    c_cat, c_wnd = st.columns(2)

    with c_cat:
        st.subheader("🏷️ Spending Category Breakdown")
        cat_sums = debits_df.groupby('category')['amount'].sum().reset_index()
        fig_pie = px.pie(
            cat_sums,
            values='amount',
            names='category',
            hole=0.45,
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        fig_pie.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            font_color='#cbd5e1',
            height=340
        )
        st.plotly_chart(fig_pie, use_container_state=True)

    with c_wnd:
        st.subheader("🗓️ Weekend vs. Weekday Daily Spend")
        weekend_df = debits_df[debits_df['is_weekend']]
        weekday_df = debits_df[~debits_df['is_weekend']]
        
        wnd_avg = weekend_df['amount'].sum() / max(weekend_df['date'].nunique(), 1)
        wkd_avg = weekday_df['amount'].sum() / max(weekday_df['date'].nunique(), 1)
        
        fig_wnd = px.bar(
            x=['Weekday Avg / Day', 'Weekend Avg / Day'],
            y=[wkd_avg, wnd_avg],
            color=['Weekday', 'Weekend'],
            labels={'x': 'Period', 'y': 'Average Daily Spend (₹)'},
            color_discrete_map={'Weekday': '#38bdf8', 'Weekend': '#c084fc'}
        )
        fig_wnd.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(15, 23, 42, 0.5)',
            font_color='#cbd5e1',
            height=340
        )
        st.plotly_chart(fig_wnd, use_container_state=True)

# =========================================================
# TAB 3: ML ANOMALY & IMPULSE LEAK DETECTOR
# =========================================================
with tab3:
    st.subheader("🤖 Isolation Forest Anomaly Detection Plot")
    st.caption("Unsupervised Machine Learning model identifies transaction amounts or times that deviate from your normal baseline.")

    if 'is_anomaly' in debits_df.columns:
        fig_anom = px.scatter(
            debits_df,
            x='hour',
            y='amount',
            color='is_anomaly',
            size='amount',
            hover_data=['merchant', 'category', 'date', 'raw_sms'],
            color_discrete_map={True: '#ef4444', False: '#38bdf8'},
            labels={'is_anomaly': 'Is Anomaly Flagged?', 'hour': 'Hour of Day (0-23)', 'amount': 'Amount (₹)'},
            title="Isolation Forest Detection (Red dots = Anomalies)"
        )
        fig_anom.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(15, 23, 42, 0.5)',
            font_color='#cbd5e1',
            height=380
        )
        st.plotly_chart(fig_anom, use_container_state=True)

        flagged_anomalies = debits_df[debits_df['is_anomaly']]
        if not flagged_anomalies.empty:
            st.markdown("🚨 **Flagged Suspicious / Abnormal Transactions:**")
            st.dataframe(
                flagged_anomalies[['timestamp', 'merchant', 'amount', 'category', 'raw_sms']],
                use_container_state=True,
                hide_index=True
            )
        else:
            st.success("🎉 No statistical anomalies detected in this transaction period.")

    st.markdown("---")
    st.subheader("💸 Micro-Transaction & Impulse Leaks (< ₹300)")
    micro_df = debits_df[debits_df['amount'] <= micro_threshold]
    
    col_m1, col_m2 = st.columns([1, 2])
    with col_m1:
        st.metric("Total Micro-Transactions", len(micro_df))
        st.metric("Accumulated Leakage", f"₹{micro_df['amount'].sum():,.2f}")
    
    with col_m2:
        if not micro_df.empty:
            micro_merchants = micro_df.groupby('merchant')['amount'].agg(['count', 'sum']).reset_index()
            micro_merchants = micro_merchants.sort_values('sum', ascending=False).head(6)
            
            fig_micro = px.bar(
                micro_merchants,
                x='merchant',
                y='sum',
                color='count',
                labels={'sum': 'Total Accumulated (₹)', 'merchant': 'Merchant', 'count': 'Txn Count'},
                title="Top Impulse Leak Vendors",
                color_continuous_scale="Purples"
            )
            fig_micro.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(15, 23, 42, 0.5)',
                font_color='#cbd5e1',
                height=280
            )
            st.plotly_chart(fig_micro, use_container_state=True)

# =========================================================
# TAB 4: SMS PARSER & LIVE SIMULATOR
# =========================================================
with tab4:
    st.subheader("📱 Live SMS Parsing Engine & Sandbox")
    st.write("Test individual SMS transaction texts against our Regex + NLP Extraction Engine.")

    sample_test_sms = st.selectbox(
        "Select a Sample SMS template or enter custom text below:",
        [
            "Spent Rs. 780.00 at SWIGGY using HDFC Credit Card 4092 on 14-Oct-24 at 11:45 PM. Avail Bal: Rs 34,200.",
            "Alert: INR 14,500.00 debited from A/C xx4901 on 15-Oct-24 at 02:30 AM to UNKNOWN GAMING STORE.",
            "Paid Rs 140.00 to Starbucks Coffee via Paytm UPI on 16-Oct-24 at 09:15 AM.",
            "Txn of Rs. 649.00 debited for NETFLIX DIGITAL SUBSCRIPTION on 18-Oct-24 at 08:00 AM."
        ]
    )
    
    test_sms_input = st.text_area("Input SMS Notification Text:", value=sample_test_sms, height=90)
    
    if st.button("⚡ Test Parse & Categorize", use_container_state=True):
        parsed_result = TransactionSMSParser.parse_single_sms(test_sms_input)
        categorizer = TransactionCategorizer()
        cat = categorizer.categorize_transaction(parsed_result['merchant'], test_sms_input)
        parsed_result['category'] = cat

        c_p1, c_p2 = st.columns(2)
        with c_p1:
            st.markdown("### Extracted Entities")
            st.json({
                "Amount": f"₹{parsed_result['amount']:,.2f}",
                "Transaction Type": parsed_result['type'],
                "Merchant / Payee": parsed_result['merchant'],
                "Category": parsed_result['category'],
                "Payment Mode": parsed_result['payment_mode'],
                "Timestamp": str(parsed_result['timestamp'])
            })
        with c_p2:
            st.markdown("### Parsing Logic Trace")
            st.success(f"✅ Amount extracted: **₹{parsed_result['amount']}**")
            st.info(f"🏷️ Merchant Identified: **{parsed_result['merchant']}**")
            st.warning(f"🕒 Hour Extracted: **{parsed_result['timestamp'].hour}:00**")

        st.markdown("---")
        if st.button("➕ Inject into Current Session Data", use_container_state=True):
            st.session_state.sms_list.append(test_sms_input)
            st.success("Successfully added transaction to session! Refreshing dashboard metrics...")
            st.rerun()

# =========================================================
# TAB 5: FILTERABLE TRANSACTION EXPLORER
# =========================================================
with tab5:
    st.subheader("📑 Full Parsed Dataset Explorer")
    
    col_f1, col_f2, col_f3 = st.columns(3)
    with col_f1:
        selected_categories = st.multiselect(
            "Filter Category:",
            options=list(processed_df['category'].unique()),
            default=list(processed_df['category'].unique())
        )
    with col_f2:
        search_query = st.text_input("Search Merchant / SMS:", "")
    with col_f3:
        type_filter = st.selectbox("Transaction Type:", ["All", "Debit", "Credit"])

    # Filter data
    filtered_df = processed_df[processed_df['category'].isin(selected_categories)].copy()
    if search_query:
        filtered_df = filtered_df[
            filtered_df['merchant'].str.contains(search_query, case=False, na=False) |
            filtered_df['raw_sms'].str.contains(search_query, case=False, na=False)
        ]
    if type_filter != "All":
        filtered_df = filtered_df[filtered_df['type'] == type_filter]

    st.write(f"Showing **{len(filtered_df)}** matching transactions:")
    
    # Render dataframe
    st.dataframe(
        filtered_df[['timestamp', 'amount', 'type', 'category', 'merchant', 'payment_mode', 'raw_sms']],
        use_container_state=True,
        hide_index=True
    )

    # CSV Download Button
    csv_data = filtered_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Export Filtered Transactions to CSV",
        data=csv_data,
        file_name="behavioral_transactions_export.csv",
        mime="text/csv",
        use_container_state=True
    )

st.markdown("---")
st.caption("Behavioral Transaction Analyzer | Built with Python, NLP/Regex, Pandas, Scikit-Learn & Streamlit")

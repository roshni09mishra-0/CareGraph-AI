import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_sample_behavioral_dataset(num_records: int = 150) -> pd.DataFrame:
    """
    Generates a realistic synthetic transaction dataset embedded with specific behavioral patterns:
    - Late-night food delivery splurges (60%+ after 8 PM)
    - Weekend shopping and entertainment surges
    - High-frequency micro-purchases (Zepto, Coffee, Snacks)
    - Statistically unusual anomalies (high amount at odd hours)
    """
    np.random.seed(42)
    random.seed(42)

    end_date = datetime(2026, 10, 1, 23, 0)
    start_date = end_date - timedelta(days=60)

    records = []

    # Category & Merchant definitions
    merchants_by_category = {
        'Food & Dining': ['Zomato', 'Swiggy', 'Starbucks', 'McDonalds', 'Dominoes Pizza', 'Third Wave Coffee', 'Chai Point'],
        'Groceries & Quick Commerce': ['Zepto', 'Blinkit', 'Instamart', 'BigBasket', 'DMart'],
        'Shopping & E-Commerce': ['Amazon India', 'Flipkart', 'Myntra', 'Zara', 'Ajio', 'Nike Store'],
        'Travel & Transport': ['Uber India', 'Ola Cabs', 'Rapido', 'HPCL Fuel', 'Fastag Toll'],
        'Bills & Utilities': ['Airtel Fiber', 'Bescom Electricity', 'Jio Recharge', 'House Rent'],
        'Entertainment & Subscriptions': ['Netflix India', 'BookMyShow', 'Spotify', 'PVR Cinemas', 'YouTube Premium'],
        'Health & Fitness': ['Apollo Pharmacy', 'Cult.fit', 'Medplus'],
        'Investments & Finance': ['Zerodha SIP', 'Groww Mutual Fund']
    }

    # Generate normal & behavioral pattern transactions
    current_time = start_date
    while len(records) < num_records - 5:
        # Step random hours (1 to 12 hours)
        current_time += timedelta(hours=random.randint(2, 14), minutes=random.randint(0, 59))
        if current_time > end_date:
            break

        hour = current_time.hour
        is_weekend = current_time.weekday() in [5, 6]

        # Behavioral condition 1: Late Night Food Splurge (8 PM - 2 AM)
        if hour >= 20 or hour <= 2:
            prob_food = 0.70
        else:
            prob_food = 0.15

        if random.random() < prob_food:
            category = 'Food & Dining'
            merchant = random.choice(merchants_by_category['Food & Dining'])
            # Late night orders tend to be slightly larger
            amount = round(random.uniform(250, 950), 2)
        elif is_weekend and random.random() < 0.5:
            # Behavioral condition 2: Weekend Shopping & Entertainment
            category = random.choice(['Shopping & E-Commerce', 'Entertainment & Subscriptions', 'Food & Dining'])
            merchant = random.choice(merchants_by_category[category])
            amount = round(random.uniform(800, 4500), 2)
        elif random.random() < 0.35:
            # Behavioral condition 3: Micro Quick Commerce / Coffee
            category = 'Groceries & Quick Commerce'
            merchant = random.choice(merchants_by_category['Groceries & Quick Commerce'])
            amount = round(random.uniform(49, 299), 2)
        else:
            # Standard daytime expenses
            category = random.choice(list(merchants_by_category.keys()))
            merchant = random.choice(merchants_by_category[category])
            amount = round(random.uniform(120, 2200), 2)

        payment_channel = random.choice(['UPI', 'UPI', 'UPI', 'Credit Card', 'Debit Card'])
        
        # Raw SMS reconstruction for realistic parsing tests
        raw_sms = f"Rs.{amount:,.2f} debited from A/C xx4910 on {current_time.strftime('%d-%b-%y %H:%M')} to {merchant} via {payment_channel} ref {random.randint(10000000, 99999999)}."

        records.append({
            'timestamp': current_time,
            'amount': amount,
            'merchant': merchant,
            'category': category,
            'transaction_type': 'Debit',
            'payment_channel': payment_channel,
            'raw_sms': raw_sms
        })

    # Add explicit Anomaly Transactions for ML Isolation Forest detection
    anomalies = [
        {
            'timestamp': datetime(2026, 9, 14, 2, 35), # 2:35 AM massive splurge
            'amount': 24999.00,
            'merchant': 'Apple Store Online',
            'category': 'Shopping & E-Commerce',
            'transaction_type': 'Debit',
            'payment_channel': 'Credit Card',
            'raw_sms': 'ALERT: Spent Rs.24,999.00 at Apple Store Online on 14-Sep-26 02:35 via Credit Card.'
        },
        {
            'timestamp': datetime(2026, 9, 22, 3, 10), # 3:10 AM luxury hotel
            'amount': 18500.00,
            'merchant': 'Taj Hotels International',
            'category': 'Travel & Transport',
            'transaction_type': 'Debit',
            'payment_channel': 'Credit Card',
            'raw_sms': 'Rs 18,500.00 debited from A/C xx4910 on 22-Sep-26 03:10 at Taj Hotels International.'
        },
        {
            'timestamp': datetime(2026, 9, 28, 23, 45), # Late night gaming equipment
            'amount': 14200.00,
            'merchant': 'Steam Games Online',
            'category': 'Entertainment & Subscriptions',
            'transaction_type': 'Debit',
            'payment_channel': 'Credit Card',
            'raw_sms': 'Paid Rs.14,200.00 to Steam Games Online on 28-Sep-2026 23:45 using Credit Card.'
        }
    ]

    records.extend(anomalies)

    df = pd.DataFrame(records)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df.sort_values('timestamp', ascending=False).reset_index(drop=True)

def get_sample_raw_sms_text() -> str:
    """Returns a block of raw SMS text notifications for quick copy-paste testing."""
    return """Rs 485.00 debited from a/c xx4910 on 01-Oct-26 at 22:45 to Zomato UPI ref 49201923.
Paid Rs.1,450.00 to Swiggy using UPI on 30-Sep-2026 21:15.
ALERT: Spent INR 899 at Netflix.com on 29-Sep-26 23:10 via Credit Card.
Your A/C ending 4910 debited for Rs 3,450 at AMAZON INDIA on 28-Sep-26 15:20.
Rs. 250.00 transferred to STARBUCKS COFFEE on 28-Sep-2026 11:30 via UPI.
Rs 18,500.00 debited from A/C xx4910 on 27-Sep-26 03:10 at Taj Hotels International.
Rs 149.00 debited for Zepto Quick Grocery on 27-Sep-26 19:40 using UPI.
Spent Rs 650.00 at Uber India on 26-Sep-26 09:15 via Credit Card.
Rs 850.00 debited at Dominoes Pizza on 25-Sep-26 22:15 via UPI.
Rs. 180.00 paid to Third Wave Coffee on 25-Sep-26 16:20.
Paid Rs.2,499.00 to Zara Retail on 24-Sep-26 17:45.
Rs 320.00 debited to Blinkit Grocery on 24-Sep-26 21:05 via UPI."""

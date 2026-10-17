import pandas as pd
import random
from datetime import datetime, timedelta

def get_sample_sms_dataset() -> list:
    """Returns a rich list of realistic transaction SMS notifications."""
    
    # Standard base date anchor
    now = datetime.now()
    
    raw_sms_samples = [
        # --- Salary Credit ---
        f"Your A/C xx4901 is Credited with INR 85,000.00 on 01-Sep-24 10:00:00 (Salary Credit TechCorp). Avail Bal: INR 94,500.",
        
        # --- Late Night Food Delivery (Behavioral Impulse Pattern) ---
        f"Spent Rs. 680.00 at SWIGGY using HDFC Credit Card 4092 on 02-Sep-24 at 10:45 PM. Ref: 981245.",
        f"Paid Rs 450.00 to Zomato Media via Paytm UPI on 04-Sep-24 at 11:15 PM. Bal: Rs 88,200.",
        f"Spent Rs. 890.00 at SWIGGY using HDFC Credit Card 4092 on 07-Sep-24 at 10:30 PM.",
        f"Paid Rs 520.00 to Zomato Media via UPI on 11-Sep-24 at 11:45 PM. Ref 482910.",
        f"Spent Rs. 1,120.00 at EatClub Foods using Card 4092 on 15-Sep-24 at 00:15 AM.",
        f"Paid Rs 740.00 to SWIGGY via PhonePe UPI on 18-Sep-24 at 11:10 PM.",
        f"Spent Rs. 980.00 at Zomato using Credit Card on 22-Sep-24 at 10:50 PM.",
        f"Spent Rs. 1,450.00 at SWIGGY GOURMET using HDFC Card on 27-Sep-24 at 11:55 PM.",
        
        # --- Weekend Shopping Bursts ---
        f"Alert: INR 4,999.00 debited from A/C xx4901 on 07-Sep-24 (Sat) at 15:30 to ZARA INDIA via UPI.",
        f"Txn of Rs. 8,450.00 done on Credit Card at MYNTRA FASHION on 08-Sep-24 (Sun) at 17:15.",
        f"Spent Rs. 12,990.00 at AMAZON INDIA using HDFC Card 4092 on 14-Sep-24 (Sat) at 14:00.",
        f"Paid Rs 3,500.00 to Nike Store via UPI on 15-Sep-24 (Sun) at 18:45.",
        f"Alert: INR 6,800.00 debited from A/C xx4901 on 21-Sep-24 (Sat) at 16:20 to H&M RETAIL.",
        f"Spent Rs. 14,200.00 at FLIPKART SHOPPING using Card on 28-Sep-24 (Sat) at 19:10.",
        
        # --- Micro-Transactions & Daily Coffee Leaks ---
        f"Paid Rs 140.00 to Starbucks Coffee via UPI on 03-Sep-24 at 09:15 AM.",
        f"Paid Rs 95.00 to Blinkit Grocery via UPI on 03-Sep-24 at 17:20.",
        f"Paid Rs 180.00 to Starbucks Coffee via UPI on 05-Sep-24 at 09:30 AM.",
        f"Paid Rs 65.00 to Chai Point via GPay UPI on 06-Sep-24 at 16:00.",
        f"Paid Rs 210.00 to Zepto Daily via UPI on 09-Sep-24 at 19:40.",
        f"Paid Rs 165.00 to Starbucks Coffee via UPI on 10-Sep-24 at 09:20 AM.",
        f"Paid Rs 120.00 to Blinkit Grocery via UPI on 12-Sep-24 at 14:15.",
        f"Paid Rs 190.00 to Starbucks Coffee via UPI on 16-Sep-24 at 09:10 AM.",
        f"Paid Rs 85.00 to Chai Point via UPI on 19-Sep-24 at 17:00.",
        f"Paid Rs 240.00 to Zepto Daily via UPI on 23-Sep-24 at 20:10.",
        
        # --- Subscriptions & Bills ---
        f"Txn of Rs. 649.00 debited for NETFLIX DIGITAL SUBSCRIPTION on 05-Sep-24 at 08:00 AM.",
        f"Paid Rs 119.00 to Spotify Music India via UPI on 05-Sep-24 at 08:05 AM.",
        f"Alert: INR 2,450.00 debited from A/C xx4901 on 10-Sep-24 to BESCOM ELECTRICITY BILL.",
        f"Paid Rs 999.00 to Airtel Fiber Broadband on 12-Sep-24 at 10:00 AM.",
        f"Txn of Rs. 649.00 debited for NETFLIX DIGITAL SUBSCRIPTION on 05-Oct-24 at 08:00 AM.",
        
        # --- Travel & Rides ---
        f"Paid Rs 340.00 to UBER RIDES via Paytm UPI on 03-Sep-24 at 08:45 AM.",
        f"Paid Rs 410.00 to OLA CABS via UPI on 05-Sep-24 at 19:30.",
        f"Paid Rs 290.00 to UBER RIDES via UPI on 10-Sep-24 at 08:50 AM.",
        f"Paid Rs 3,850.00 to HPCL PETROL PUMP via Card on 13-Sep-24 at 11:20 AM.",
        f"Paid Rs 360.00 to UBER RIDES via UPI on 17-Sep-24 at 20:00.",
        
        # --- ML Anomalies (Off-Hour High Spends & Unexpected Vendors) ---
        f"A/C xx4901 Debited with Rs 18,500.00 on 16-Sep-24 at 02:45:00 AM by transfer to UNKNOWN ONLINE CASINO. Bal: Rs 32,100.",
        f"Txn of USD 350.00 (INR 29,150.00) done on Credit Card at CRYPTOEXCHANGE GLOBAL on 25-Sep-24 at 03:15 AM."
    ]
    return raw_sms_samples

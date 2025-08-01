# backend/api/utils/send_otp_email.py

import smtplib
import sys
import os

def sendRejectionEmail(to_email, vendor_name, from_email, from_password):
    """
    Connects to the Gmail SMTP server and sends a rejection email to the vendor.
    """
    try:
        # Create an SMTP session
        s = smtplib.SMTP('smtp.gmail.com', 587)
        s.starttls()  # Start TLS for security

        # Login to your email account using the app password
        s.login(from_email, from_password)

        # Prepare the message
        message = f"""From: esepapertrading <{from_email}>
To: {to_email}
Subject: Rejection Notification

Dear {vendor_name},

We regret to inform you that your application has been rejected. 
For any refund-related queries, please contact us at: 7075923765.
Thank you for your understanding.

Regards,
ESE Paper Pvt. Ltd.
"""

        # Send the email
        s.sendmail(from_email, to_email, message)
        print("Email sent successfully.")

    except smtplib.SMTPAuthenticationError:
        print("Authentication error: Check your GMAIL_USER and GMAIL_APP_PASS in the .env file.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred while sending email: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        s.quit()  # Always close the SMTP session


# Command-line usage: python send_otp_email.py <recipient_email> <vendor_name>
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python send_otp_email.py <recipient_email> <vendor_name>", file=sys.stderr)
        sys.exit(1)

    to_email = sys.argv[1]
    vendor_name = sys.argv[2]

    from_email = os.getenv('GMAIL_USER')
    from_password = os.getenv('GMAIL_APP_PASS')

    if not from_email or not from_password:
        print("Fatal: GMAIL_USER or GMAIL_APP_PASS are not set in environment variables.", file=sys.stderr)
        sys.exit(1)

    sendRejectionEmail(to_email, vendor_name, from_email, from_password)

import smtplib, sys, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send(to_email, subject, body, from_email, from_password):
    s = smtplib.SMTP('smtp.gmail.com', 587)
    try:
        s.starttls()
        s.login(from_email, from_password)
        msg = MIMEMultipart()
        msg['From'] = f"esepapertrading <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        s.sendmail(from_email, to_email, msg.as_string())
        print("✅ User email sent.")
    finally:
        s.quit()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python sendGenericUserEmail.py <to_email> <subject> <body>")
        sys.exit(1)
    to_email, subject, body = sys.argv[1], sys.argv[2], sys.argv[3]
    FROM_EMAIL = os.getenv("GMAIL_USER")
    FROM_PASSWORD = os.getenv("GMAIL_APP_PASS")
    if not FROM_EMAIL or not FROM_PASSWORD:
        print("❌ Missing GMAIL_USER or GMAIL_APP_PASS")
        sys.exit(1)
    send(to_email, subject, body, FROM_EMAIL, FROM_PASSWORD)

import { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, QrCode, Smartphone } from 'lucide-react';
import './Payment.css';

const PaymentMock = ({ amount, onPaymentSuccess, onCancel }) => {
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes to pay

    // Custom UPI ID provided by user
    const upiId = 'h.balaji1964@oksbi';
    const merchantName = 'Balaji';
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

    useEffect(() => {
        let interval;
        if (!success && !processing) {
            interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [success, processing]);

    const handleConfirmPayment = () => {
        setProcessing(true);

        // Simulate scanning and confirmation delay
        setTimeout(() => {
            setProcessing(false);
            setSuccess(true);

            // Trigger success callback after showing success state briefly
            setTimeout(() => {
                if (onPaymentSuccess) onPaymentSuccess();
            }, 1500);
        }, 2000);
    };

    if (success) {
        return (
            <div className="payment-overlay">
                <div className="payment-card success-state glass">
                    <div className="success-animation">
                        <CheckCircle size={80} className="text-success mb-4" />
                    </div>
                    <h2>Payment Received!</h2>
                    <p>Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-overlay">
            <div className="payment-card glass payment-qr-card">
                <div className="payment-header">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Google_Pay_Logo.svg" alt="GPay" className="gpay-logo" />
                    <h2>Scan & Pay</h2>
                    <p>Complete your booking via Google Pay</p>
                </div>

                <div className="qr-container-wrapper">
                    <div className="qr-code-box">
                        <img
                            src={qrImageUrl}
                            alt="Payment QR Code"
                            style={{ width: '200px', height: '200px', display: 'block' }}
                        />
                        {processing && (
                            <div className="qr-overlay-loading">
                                <div className="spinner"></div>
                                <span>Verifying...</span>
                            </div>
                        )}
                        <div className="qr-corner top-left"></div>
                        <div className="qr-corner top-right"></div>
                        <div className="qr-corner bottom-left"></div>
                        <div className="qr-corner bottom-right"></div>
                    </div>
                    <div className="payment-timer">
                        QR expires in: <strong>{Math.floor(timer / 60)}:{timer % 60 < 10 ? `0${timer % 60}` : timer % 60}</strong>
                    </div>
                </div>

                <div className="payment-details-box">
                    <div className="detail-item">
                        <span>Payable Amount:</span>
                        <strong className="amount-text">₹{amount}</strong>
                    </div>
                    <div className="detail-item">
                        <span>Merchant:</span>
                        <strong>{merchantName}</strong>
                    </div>
                    <div className="detail-item">
                        <span>UPI ID:</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{upiId}</span>
                    </div>
                </div>

                <div className="payment-steps">
                    <div className="step">
                        <Smartphone size={20} />
                        <p>Open GPay App</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <QrCode size={20} />
                        <p>Scan QR Code</p>
                    </div>
                </div>

                <div className="payment-footer">
                    <div className="secure-badge">
                        <ShieldCheck size={16} className="text-success" />
                        <span>Secure UPI Payment</span>
                    </div>
                    <div className="action-buttons mt-4 flex gap-3 w-full">
                        <button
                            type="button"
                            className="btn btn-outline flex-1"
                            onClick={onCancel}
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary flex-1 btn-confirm-pay"
                            onClick={handleConfirmPayment}
                            disabled={processing || timer === 0}
                        >
                            {processing ? 'Verifying...' : 'I Have Paid'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentMock;

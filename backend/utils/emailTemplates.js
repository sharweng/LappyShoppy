const getOrderConfirmationEmail = (order) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  const itemsHTML = order.orderItems
    .map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">₱${item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 12px; text-align: right;">₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f9fafb;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                padding: 30px;
                color: white;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 5px;
                font-weight: 700;
            }
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .order-status {
                background-color: #d1fae5;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin-bottom: 25px;
                border-radius: 4px;
            }
            .order-status p {
                color: #065f46;
                font-size: 14px;
                margin: 5px 0;
            }
            .order-status strong {
                color: #047857;
            }
            .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #1f2937;
                margin-top: 25px;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-box {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
            }
            .info-box p {
                font-size: 13px;
                color: #6b7280;
                margin: 5px 0;
            }
            .info-box strong {
                color: #1f2937;
                display: block;
                margin-bottom: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            thead {
                background-color: #3B82F6;
                color: white;
            }
            th {
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
            }
            td {
                padding: 12px;
                font-size: 13px;
                color: #4b5563;
            }
            .text-right {
                text-align: right;
            }
            .summary {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
                color: #6b7280;
            }
            .summary-row.total {
                border-top: 2px solid #e5e7eb;
                padding-top: 12px;
                margin-top: 12px;
                font-weight: 700;
                font-size: 16px;
                color: #1f2937;
            }
            .summary-row strong {
                color: #1f2937;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 600;
                text-align: center;
            }
            .cta-button:hover {
                opacity: 0.9;
            }
            .footer {
                background-color: #f3f4f6;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                font-size: 12px;
                color: #6b7280;
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background-color: #e5e7eb;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmed!</h1>
                <p>Your order has been successfully placed</p>
            </div>
            
            <div class="content">
                <p class="greeting">Hi ${order.user?.name || 'Valued Customer'},</p>
                
                <div class="order-status">
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                    <p><strong>Status:</strong> ${order.orderStatus}</p>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Thank you for your purchase! We've received your order and will start processing it right away. A PDF receipt is attached to this email for your records.
                </p>

                <div class="section-title">Items Ordered</div>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <strong>₱${order.itemsPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tax (12%):</span>
                        <strong>₱${order.taxPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <strong>${order.shippingPrice === 0 ? 'FREE' : `₱${order.shippingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</strong>
                    </div>
                    <div class="summary-row total">
                        <span>TOTAL AMOUNT:</span>
                        <span style="color: #3B82F6;">₱${order.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="section-title">Shipping Address</div>
                <div class="info-grid" style="grid-template-columns: 1fr;">
                    <div class="info-box">
                        <p>${order.shippingInfo.address}</p>
                        <p>${order.shippingInfo.city}, ${order.shippingInfo.postalCode}</p>
                        <p>${order.shippingInfo.country}</p>
                        <p>${order.shippingInfo.phoneNo}</p>
                    </div>
                </div>

                <div class="section-title">Payment Method</div>
                <div class="info-box">
                    <p>${order.paymentInfo?.id === 'COD' ? 'Cash on Delivery' : 'Card Payment'}</p>
                </div>

                <a href="${clientUrl}/order/${order._id}" class="cta-button">Track Your Order</a>
            </div>

            <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions about your order, please don't hesitate to reach out to us.</p>
                <div class="divider"></div>
                <p>© 2025 LappyShoppy. All rights reserved.</p>
                <p>Your Premium Laptop Store</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const getOrderStatusUpdateEmail = (order) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  const itemsHTML = order.orderItems
    .map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">₱${item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 12px; text-align: right;">₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      </tr>
    `)
    .join('');

  const statusMessages = {
    'Processing': 'Your order is being prepared for shipment',
    'Shipped': 'Your order has been shipped and is on its way!',
    'Delivered': 'Your order has been delivered!',
    'Cancelled': 'Your order has been cancelled'
  };

  const statusColors = {
    'Processing': '#FFA500',
    'Shipped': '#3B82F6',
    'Delivered': '#10B981',
    'Cancelled': '#EF4444'
  };

  const statusColor = statusColors[order.orderStatus] || '#6B7280';
  const statusMessage = statusMessages[order.orderStatus] || 'Your order status has been updated';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f9fafb;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%);
                padding: 30px;
                color: white;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .header p {
                font-size: 16px;
                opacity: 0.95;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .status-alert {
                background-color: rgba(${hexToRgb(statusColor)}, 0.1);
                border-left: 4px solid ${statusColor};
                padding: 15px;
                margin-bottom: 25px;
                border-radius: 4px;
            }
            .status-alert p {
                color: #1f2937;
                font-size: 15px;
                margin: 8px 0;
                line-height: 1.5;
            }
            .status-alert strong {
                color: ${statusColor};
                font-size: 16px;
            }
            .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #1f2937;
                margin-top: 25px;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .info-box {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            .info-box p {
                font-size: 13px;
                color: #6b7280;
                margin: 5px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            thead {
                background-color: ${statusColor};
                color: white;
            }
            th {
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
            }
            td {
                padding: 12px;
                font-size: 13px;
                color: #4b5563;
            }
            .summary {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
                color: #6b7280;
            }
            .summary-row.total {
                border-top: 2px solid #e5e7eb;
                padding-top: 12px;
                margin-top: 12px;
                font-weight: 700;
                font-size: 16px;
                color: #1f2937;
            }
            .summary-row strong {
                color: #1f2937;
            }
            .cta-button {
                display: block;
                background: ${statusColor};
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                margin-bottom: 20px;
                font-weight: 600;
                text-align: center;
                width: 100%;
                box-sizing: border-box;
            }
            .cta-button:hover {
                opacity: 0.9;
            }
            .footer {
                background-color: #f3f4f6;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                font-size: 12px;
                color: #6b7280;
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background-color: #e5e7eb;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Status Updated</h1>
                <p>Order ID: ${order._id}</p>
            </div>
            
            <div class="content">
                <p class="greeting">Hi ${order.user?.name || 'Valued Customer'},</p>
                
                <div class="status-alert">
                    <p><strong>${statusMessage}</strong></p>
                    <p>Current Status: <strong style="color: ${statusColor};">${order.orderStatus}</strong></p>
                    <p>Updated on: ${new Date().toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                </div>

                <div class="section-title">Order Details</div>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <strong>₱${order.itemsPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tax (12%):</span>
                        <strong>₱${order.taxPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <strong>${order.shippingPrice === 0 ? 'FREE' : `₱${order.shippingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</strong>
                    </div>
                    <div class="summary-row total">
                        <span>TOTAL AMOUNT:</span>
                        <span style="color: ${statusColor};">₱${order.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="section-title">Shipping Address</div>
                <div class="info-box">
                    <p>${order.shippingInfo.address}</p>
                    <p>${order.shippingInfo.city}, ${order.shippingInfo.postalCode}</p>
                    <p>${order.shippingInfo.country}</p>
                    <p>${order.shippingInfo.phoneNo}</p>
                </div>

                <a href="${clientUrl}/order/${order._id}" class="cta-button">View Order Details</a>
            </div>

            <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions, please contact us.</p>
                <div class="divider"></div>
                <p>© 2025 LappyShoppy. All rights reserved.</p>
                <p>Your Premium Laptop Store</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const getForgotPasswordEmail = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f9fafb;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                padding: 30px;
                color: white;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 5px;
                font-weight: 700;
            }
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .info-box {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .info-box p {
                font-size: 13px;
                color: #6b7280;
                margin: 5px 0;
            }
            .info-box strong {
                color: #1f2937;
                display: block;
                margin-bottom: 5px;
            }
            .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #1f2937;
                margin-top: 25px;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .message-box {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 25px;
            }
            .alert-box {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin-bottom: 25px;
                border-radius: 4px;
            }
            .alert-box p {
                color: #92400e;
                font-size: 13px;
                margin: 5px 0;
            }
            .alert-box strong {
                color: #b45309;
            }
            .reset-link {
                word-break: break-all;
                color: #3B82F6;
                font-size: 12px;
                font-family: 'Courier New', monospace;
                background-color: white;
                padding: 12px;
                border-radius: 4px;
                border: 1px solid #e5e7eb;
                line-height: 1.6;
            }
            .cta-button {
                display: block;
                background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                margin-bottom: 20px;
                font-weight: 600;
                text-align: center;
                width: 100%;
                box-sizing: border-box;
            }
            .cta-button:hover {
                opacity: 0.9;
            }
            .footer {
                background-color: #f3f4f6;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                font-size: 12px;
                color: #6b7280;
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background-color: #e5e7eb;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>Secure your account with a new password</p>
            </div>
            
            <div class="content">
                <p class="greeting">Hi ${userName},</p>
                
                <p class="message-box">
                    We received a request to reset the password for your LappyShoppy account. Click the button below to create a new password. If you didn't make this request, you can safely ignore this email.
                </p>

                <div class="alert-box">
                    <p><strong>This link will expire in 30 minutes</strong></p>
                    <p>For security reasons, you must reset your password within 30 minutes of receiving this email.</p>
                </div>

                <a href="${resetUrl}" class="cta-button">Reset Your Password</a>

                <div class="section-title">Or Copy The Link Below</div>
                <div class="info-box">
                    <p><strong>If the button above doesn't work:</strong></p>
                    <p>Copy and paste this link into your browser:</p>
                    <div class="reset-link">${resetUrl}</div>
                </div>

                <div class="section-title">Security Tips</div>
                <div class="info-box">
                    <p><strong>Use a Strong Password</strong></p>
                    <p>Include uppercase, lowercase, numbers, and symbols (e.g., !@#$%)</p>
                    
                    <p style="margin-top: 10px;"><strong>Never Share Your Password</strong></p>
                    <p>LappyShoppy staff will never ask for your password via email</p>
                    
                    <p style="margin-top: 10px;"><strong>Don't Reuse Passwords</strong></p>
                    <p>Use a unique password different from other accounts</p>
                </div>

                <p style="color: #6b7280; font-size: 13px; margin-top: 20px; font-style: italic;">
                    <strong>Didn't request this?</strong> If you didn't ask for a password reset, you can ignore this email. Your account is secure until someone uses the reset link.
                </p>
            </div>

            <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions, please don't hesitate to reach out to us.</p>
                <div class="divider"></div>
                <p>© 2025 LappyShoppy. All rights reserved.</p>
                <p>Your Premium Laptop Store</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

module.exports = {
  getOrderConfirmationEmail,
  getOrderStatusUpdateEmail,
  getForgotPasswordEmail
};

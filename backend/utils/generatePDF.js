const PDFDocument = require('pdfkit');
const path = require('path');

const generateOrderPDF = (order, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('LAPPY SHOPPY', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('Your Premium Laptop Store', { align: 'center' })
        .moveDown(0.5);

      // Divider
      doc.strokeColor('#3B82F6')
        .lineWidth(2)
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .stroke()
        .moveDown();

      // Title
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('ORDER RECEIPT', { align: 'center' })
        .moveDown(0.5);

      // Order Details
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text(`Order ID: ${order._id}`, 40, doc.y)
        .font('Helvetica')
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`)
        .text(`Status: ${order.orderStatus}`)
        .moveDown();

      // Customer Info
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('CUSTOMER INFORMATION')
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${order.user?.name || 'N/A'}`)
        .text(`Email: ${order.user?.email || 'N/A'}`)
        .moveDown();

      // Shipping Address
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('SHIPPING ADDRESS')
        .fontSize(10)
        .font('Helvetica')
        .text(`${order.shippingInfo.address}`)
        .text(`${order.shippingInfo.city}, ${order.shippingInfo.postalCode}`)
        .text(`${order.shippingInfo.country}`)
        .text(`Phone: ${order.shippingInfo.phoneNo}`)
        .moveDown();

      // Items Table
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('ORDER ITEMS')
        .moveDown(0.3);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 280;
      const col3 = 380;
      const col4 = 480;

      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#3B82F6')
        .rect(40, tableTop, doc.page.width - 80, 20)
        .fill()
        .fillColor('white')
        .text('Product', col1, tableTop + 5)
        .text('Qty', col2, tableTop + 5)
        .text('Unit Price', col3, tableTop + 5)
        .text('Subtotal', col4, tableTop + 5)
        .fillColor('black');

      let yPosition = tableTop + 25;
      doc.fontSize(9).font('Helvetica');

      // Table rows
      order.orderItems.forEach((item, index) => {
        const productName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
        const unitPrice = `₱${item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        const subtotal = `₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        
        doc.text(productName, col1, yPosition)
          .text(item.quantity.toString(), col2, yPosition)
          .text(unitPrice, col3, yPosition)
          .text(subtotal, col4, yPosition);

        yPosition += 20;
      });

      yPosition += 10;

      // Divider
      doc.strokeColor('#E5E7EB')
        .lineWidth(1)
        .moveTo(40, yPosition)
        .lineTo(doc.page.width - 40, yPosition)
        .stroke();

      yPosition += 15;

      // Summary section
      const subtotalText = `₱${order.itemsPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const taxText = `₱${order.taxPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const shippingText = `₱${order.shippingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const totalText = `₱${order.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

      doc.fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 50, yPosition)
        .text(subtotalText, col4, yPosition);

      yPosition += 15;
      doc.text('Tax (12%):', 50, yPosition)
        .text(taxText, col4, yPosition);

      yPosition += 15;
      doc.text('Shipping:', 50, yPosition)
        .text(shippingText, col4, yPosition);

      yPosition += 15;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#3B82F6')
        .text('TOTAL:', 50, yPosition)
        .text(totalText, col4, yPosition)
        .fillColor('black');

      yPosition += 25;

      // Payment Info - Full width
      const paymentStatus = order.paymentInfo?.status || 'Pending';
      const capitalizedPaymentStatus = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
      
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYMENT INFORMATION', 40, yPosition)
        .fontSize(9)
        .font('Helvetica')
        .text(`Method: ${order.paymentInfo?.id === 'COD' ? 'Cash on Delivery' : 'Card Payment'}`, 40)
        .text(`Status: ${capitalizedPaymentStatus}`, 40);

      // Footer
      doc.moveDown(2)
        .fontSize(8)
        .fillColor('#666')
        .text('Thank you for your purchase! For any questions, please contact us.', { align: 'center' })
        .text('LappyShoppy - Your Premium Laptop Store', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateOrderPDF };

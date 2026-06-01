/**
 * Certificate Generator — Professional PDF using pdfkit
 * Dynamic fields: studentName, courseName, completionDate, percentage
 * Text: "This is to certify that [User Name] has successfully completed
 *        the course [Course Name] with [XX%] performance."
 */
const PDFDocument = require('pdfkit');

/**
 * @param {string} studentName
 * @param {string} courseName
 * @param {string} instructorName
 * @param {Date}   completionDate
 * @param {number} percentage  — e.g. 87
 */
const generateCertificate = (studentName, courseName, instructorName, completionDate, percentage = 100) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 842, H = 595;

    // ── Background
    doc.rect(0, 0, W, H).fill('#0a1628');
    doc.rect(0, 0, W, 8).fill('#f0a500');
    doc.rect(0, H - 8, W, 8).fill('#f0a500');

    // ── Corner brackets
    const drawCorner = (x, y, flipX, flipY) => {
      doc.save();
      doc.translate(x, y);
      doc.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      doc.rect(0, 0, 80, 6).fill('#f0a500');
      doc.rect(0, 0, 6, 80).fill('#f0a500');
      doc.restore();
    };
    drawCorner(30, 30, false, false);
    drawCorner(W - 30, 30, true, false);
    drawCorner(30, H - 30, false, true);
    drawCorner(W - 30, H - 30, true, true);

    // ── Double border
    doc.rect(22, 22, W - 44, H - 44).stroke('#f0a500').lineWidth(2);
    doc.rect(30, 30, W - 60, H - 60).stroke('rgba(240,165,0,0.35)').lineWidth(1);

    // ── Watermark
    doc.save();
    doc.opacity(0.04);
    doc.fontSize(130).fillColor('#f0a500').font('Helvetica-Bold')
       .text('EduLearn', 0, H / 2 - 70, { align: 'center', width: W });
    doc.restore();

    // ── Brand
    doc.fillColor('#f0a500').font('Helvetica-Bold').fontSize(42)
       .text('EduLearn', 0, 52, { align: 'center', width: W });

    // ── Subtitle bar
    doc.fillColor('rgba(255,255,255,0.55)').font('Helvetica').fontSize(11)
       .text('ONLINE LEARNING MANAGEMENT SYSTEM', 0, 99, { align: 'center', width: W, characterSpacing: 2 });

    doc.moveTo(160, 122).lineTo(W - 160, 122).stroke('#f0a500').lineWidth(0.8);

    // ── Title
    doc.fillColor('#f0a500').font('Helvetica-Bold').fontSize(24)
       .text('CERTIFICATE OF COMPLETION', 0, 136, { align: 'center', width: W, characterSpacing: 1.5 });

    // ── "This is to certify that"
    doc.fillColor('rgba(255,255,255,0.68)').font('Helvetica').fontSize(13)
       .text('This is to certify that', 0, 182, { align: 'center', width: W });

    // ── Student name (prominent)
    doc.fillColor('#f0a500').font('Helvetica-Bold').fontSize(36)
       .text(studentName, 0, 206, { align: 'center', width: W });

    // ── Underline beneath name
    const nameWidth = Math.min(studentName.length * 19, 340);
    const lineX = (W - nameWidth) / 2;
    doc.moveTo(lineX, 252).lineTo(lineX + nameWidth, 252).stroke('#f0a500').lineWidth(0.9);

    // ── Main certification text (dynamic)
    const certText =
      `has successfully completed the course "${courseName}" with ${percentage}% performance.`;
    doc.fillColor('rgba(255,255,255,0.78)').font('Helvetica').fontSize(13)
       .text(certText, 80, 264, { align: 'center', width: W - 160, lineBreak: true });

    // ── Details row
    const dateStr = new Date(completionDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const detailY = 390;

    // Performance badge (left)
    doc.roundedRect(110, detailY - 6, 140, 52, 8).fill('rgba(240,165,0,0.12)');
    doc.fillColor('#f0a500').font('Helvetica-Bold').fontSize(28)
       .text(`${percentage}%`, 110, detailY - 2, { width: 140, align: 'center' });
    doc.fillColor('rgba(255,255,255,0.5)').font('Helvetica').fontSize(9)
       .text('PERFORMANCE SCORE', 110, detailY + 28, { width: 140, align: 'center', characterSpacing: 0.5 });

    // Date (center)
    doc.fillColor('rgba(255,255,255,0.60)').font('Helvetica').fontSize(11)
       .text(`Date: ${dateStr}`, 0, detailY + 8, { align: 'center', width: W });

    // Instructor info
    doc.fillColor('rgba(255,255,255,0.45)').font('Helvetica').fontSize(10)
       .text(`Instructor: ${instructorName}`, 0, detailY + 26, { align: 'center', width: W });

    // Signature line (right)
    doc.moveTo(W - 250, detailY + 10).lineTo(W - 100, detailY + 10).stroke('#f0a500').lineWidth(0.8);
    doc.fillColor('#f0a500').font('Helvetica-Bold').fontSize(10)
       .text('EduLearn Authority', W - 262, detailY + 15, { width: 175, align: 'center' });
    doc.fillColor('rgba(255,255,255,0.40)').font('Helvetica').fontSize(9)
       .text('Authorized Signature', W - 262, detailY + 29, { width: 175, align: 'center' });

    // ── Footer note
    doc.moveTo(160, H - 52).lineTo(W - 160, H - 52).stroke('#f0a500').lineWidth(0.5);
    doc.fillColor('rgba(255,255,255,0.38)').font('Helvetica').fontSize(9)
       .text(
         'This certificate is issued upon successful completion and passing the final examination with 75% or above.',
         80, H - 44, { align: 'center', width: W - 160 }
       );

    doc.end();
  });
};

module.exports = generateCertificate;

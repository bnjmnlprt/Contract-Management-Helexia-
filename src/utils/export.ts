// Because we're using CDN scripts, we need to declare the globals for TypeScript
declare const jspdf: any;
declare const html2canvas: any;
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}
import type { ChangeRequest } from './types';

/**
 * Hides specified elements, captures a DOM element as a canvas, 
 * adds it as an image to a PDF, and then un-hides the elements.
 * @param {string} elementId The ID of the DOM element to capture.
 * @param {string} fileName The name of the PDF file to save.
 * @param {string} hideSelector A CSS selector for elements to hide during capture.
 */
export const exportElementAsPdf = async (elementId: string, fileName: string, hideSelector: string) => {
    const elementToExport = document.getElementById(elementId);
    const elementsToHide = document.querySelectorAll(hideSelector);

    if (!elementToExport) {
        console.error(`Element with id "${elementId}" not found.`);
        alert(`Erreur: L'élément à exporter n'a pas été trouvé.`);
        return;
    }

    // Hide elements before capture
    elementsToHide.forEach(el => el.classList.add('export-hide'));

    try {
        const canvas = await window.html2canvas(elementToExport, {
            scale: 2, // Higher scale for better resolution
            useCORS: true,
            logging: false,
            // Ensure the whole element is captured, not just the visible part
            windowWidth: elementToExport.scrollWidth,
            windowHeight: elementToExport.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let imgWidth = pdfWidth - 20; // Margin of 10mm on each side
        let imgHeight = imgWidth / ratio;
        
        // If the calculated height is greater than the page height, scale based on height instead
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20; // Margin of 10mm top/bottom
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10; // 10mm top margin

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(fileName);

    } catch (error) {
        console.error("Error during PDF export:", error);
        alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
        // Crucially, ensure elements are made visible again even if an error occurs
        elementsToHide.forEach(el => el.classList.remove('export-hide'));
    }
};

/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param {any[]} data Array of objects to convert.
 * @param {string} fileName The name of the CSV file to save.
 */
export const exportDataAsCsv = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }

    const headers = Object.keys(data[0]);
    // On utilise le point-virgule comme séparateur pour la compatibilité Excel FR
    const csvContent = [
        headers.join(';'),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : row[header];
                let cellString = String(cell);
                // Si la cellule contient des guillemets, le séparateur, ou un saut de ligne, on l'entoure de guillemets
                if (cellString.includes('"') || cellString.includes(';') || cellString.includes('\n')) {
                    cellString = `"${cellString.replace(/"/g, '""')}"`;
                }
                return cellString;
            }).join(';')
        )
    ].join('\n');

    // On utilise un Blob avec un BOM UTF-8 pour une compatibilité maximale
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export const exportChangeRequestAsPdf = (request: ChangeRequest) => {
    const doc = new window.jspdf.jsPDF();
    const margin = 15;
    let y = 20;

    // --- En-tête ---
    // doc.addImage("URL_DU_LOGO_HELEXIA", 'PNG', margin, 10, 40, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DEMANDE DE CHANGEMENT', 105, y, { align: 'center' });
    y += 15;

    // --- Informations Générales ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJET', margin, y);
    doc.text('DEMANDE N°', 105, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.projectName, margin, y + 5);
    doc.text(request.changeNumber || `CHG-${request.projectCode}-XXX`, 105, y + 5);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('CONTRAT DE RÉFÉRENCE', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.contractRef, margin, y + 5);
    y += 15;

    // --- Section Demandeur ---
    doc.setFont('helvetica', 'bold');
    doc.text('DEMANDEUR', margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 2, 195, y + 2);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('NOM:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.requesterName, margin + 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 105, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(request.createdAt).toLocaleDateString('fr-FR'), 105 + 25, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.requesterContact, margin + 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text('PRIORITÉ:', 105, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.priority, 105 + 25, y);
    y += 15;

    // --- Section Description du Changement ---
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION DU CHANGEMENT', margin, y);
    doc.line(margin, y + 2, 195, y + 2);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Élément à modifier:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.elementToModify, margin, y + 5);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.text('Description détaillée:', margin, y);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(request.description, 180);
    doc.text(descLines, margin, y + 5);
    y += descLines.length * 5 + 10;

    // --- Section Impacts ---
    doc.setFont('helvetica', 'bold');
    doc.text('IMPACTS PRÉVISIONNELS', margin, y);
    doc.line(margin, y + 2, 195, y + 2);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Calendrier prévu:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.expectedTimeline || 'N/A', margin + 40, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Coût estimé:', 105, y);
    doc.setFont('helvetica', 'normal');
    doc.text(request.estimatedCost !== null ? `${request.estimatedCost.toLocaleString('fr-FR')} €` : 'N/A', 105 + 30, y);
    y += 25;

    // --- Section Approbation (pour signature) ---
    doc.setFont('helvetica', 'bold');
    doc.text('APPROBATION', margin, y);
    doc.line(margin, y + 2, 195, y + 2);
    y += 20;

    doc.text('Pour le Demandeur (Client)', margin, y);
    doc.text('Pour Helexia', 130, y);
    y += 25;

    doc.line(margin, y, margin + 70, y); // Ligne signature Client
    doc.line(130, y, 130 + 70, y); // Ligne signature Helexia
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Nom, Date et Signature', margin, y);
    doc.text('Nom, Date et Signature', 130, y);

    // Sauvegarde du fichier
    doc.save(`demande_changement_${request.changeNumber || request.id}.pdf`);
};
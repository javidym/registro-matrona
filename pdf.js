/* Genera el registro como PDF A4 real (texto y tablas vectoriales) en UNA sola cara:
   si el contenido no cabe, se reduce la letra y las alturas hasta que quepa. */
'use strict';

const PDF_C = {
  rosa: [183, 122, 127], rosaLinea: [234, 209, 210], rosaFondo: [248, 236, 237],
  beige: [239, 228, 212], borde: [205, 184, 168], tinta: [61, 48, 44], suave: [138, 119, 112], raya: [228, 218, 208],
};
const PDF_W = 210, PDF_H = 297, PDF_M = 12;

let pdfMarcaAgua = null;
function marcaAguaPng(svg) {
  if (pdfMarcaAgua) return Promise.resolve(pdfMarcaAgua);
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 800;
      c.getContext('2d').drawImage(img, 0, 0, 800, 800);
      try { pdfMarcaAgua = c.toDataURL('image/png'); } catch { pdfMarcaAgua = null; }
      res(pdfMarcaAgua);
    };
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  });
}

// Texto centrado con espaciado entre letras
function textoEspaciado(doc, txt, y, cs) {
  const w = doc.getTextWidth(txt) + cs * (txt.length - 1);
  doc.setCharSpace(cs); doc.text(txt, (PDF_W - w) / 2, y); doc.setCharSpace(0);
}

// Una línea tipo "Etiqueta: valor | Etiqueta: valor" con el valor subrayado
function lineaCampos(doc, partes, y, fs) {
  let x = PDF_M;
  partes.forEach((p, i) => {
    if (i) { doc.setFont('times', 'normal'); doc.setTextColor(...PDF_C.suave); doc.text('|', x + 2, y); x += 6; }
    doc.setFont('times', 'bold'); doc.setFontSize(fs + 1); doc.setTextColor(...PDF_C.tinta);
    doc.text(p.label + ':', x, y); x += doc.getTextWidth(p.label + ':') + 1.8;
    if (p.draw) { x = p.draw(x); return; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fs);
    const val = p.value || '';
    const w = Math.max(doc.getTextWidth(val) + 3, p.min || 20);
    doc.text(val, x + 1.5, y - 0.3);
    doc.setDrawColor(...PDF_C.borde); doc.setLineWidth(0.25); doc.line(x, y + 0.9, x + w, y + 0.9);
    x += w + 1;
  });
}

function construirPdf(d, info, fs) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const k = fs / 9;                       // factor para espaciados
  const lh = fs * 0.3528 * 1.25;          // alto de línea en mm
  let y = PDF_M + 6;

  // Cabecera
  doc.setFont('times', 'normal'); doc.setFontSize(20); doc.setTextColor(...PDF_C.rosa);
  doc.text('Vanesa Ballester', PDF_W / 2, y, { align: 'center' });
  y += 5.5;
  doc.setFontSize(10); doc.setTextColor(...PDF_C.suave); textoEspaciado(doc, 'MATRONA INTEGRATIVA', y, 1.3);
  y += 4.2;
  doc.setFontSize(8.5); doc.text('Nº Colegiado 15 375', PDF_W / 2, y, { align: 'center' });
  y += 7 * k;

  lineaCampos(doc, [{ label: 'Nombre', value: info.nombre, min: 50 }], y, fs); y += 6 * k;
  lineaCampos(doc, [{ label: 'Día', value: d.dia, min: 30 }, { label: 'Fecha', value: info.fecha, min: 22 }], y, fs);
  y += 2 * k;

  const seccion = (t) => {
    y += 6 * k;
    doc.setFont('times', 'bold'); doc.setFontSize(fs + 3.5); doc.setTextColor(...PDF_C.rosa);
    doc.text(t, PDF_M, y);
    y += 1.5;
    doc.setDrawColor(...PDF_C.rosaLinea); doc.setLineWidth(0.45); doc.line(PDF_M, y, PDF_W - PDF_M, y);
    y += 2;
  };
  const tabla = (head, body, minH, anchos) => {
    doc.autoTable({
      startY: y, margin: { left: PDF_M, right: PDF_M }, theme: 'grid', head: [head], body,
      styles: {
        font: 'helvetica', fontSize: fs, textColor: PDF_C.tinta, lineColor: PDF_C.borde, lineWidth: 0.25,
        cellPadding: 1.4 * k, valign: 'top', minCellHeight: minH, fillColor: false, overflow: 'linebreak',
      },
      headStyles: { font: 'times', fontStyle: 'bold', fillColor: PDF_C.beige, textColor: PDF_C.tinta, halign: 'center', valign: 'middle', minCellHeight: 0, fontSize: fs },
      columnStyles: anchos ? Object.assign(Object.fromEntries(anchos.map((w, i) => [i, { cellWidth: w }])),
        { 0: { font: 'times', fontStyle: 'bold', fillColor: PDF_C.rosaFondo, cellWidth: anchos[0], fontSize: fs + 0.5 } }) : {},
      pageBreak: 'avoid', rowPageBreak: 'avoid',
    });
    y = doc.lastAutoTable.finalY;
  };

  seccion('Alimentación y digestión');
  tabla(['', ...COLS.map((c) => c.label)],
    COMIDAS.map(([mk, mn]) => [mn, ...COLS.map((c) => d[`${mk}.${c.k}`] || '')]), 11 * k, [21, 55, 28, 29, 24, 29]);

  y += 6 * k;
  lineaCampos(doc, [{ label: 'Agua total del día', value: d.agua ? `${d.agua} ${d.aguaUnidad}` : '', min: 22 }], y, fs);
  if (!d.agua) { doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); doc.setTextColor(...PDF_C.suave); doc.text('vasos / litros', PDF_M + 58, y); }
  y += 6 * k;
  lineaCampos(doc, [
    { label: 'Cafeína (café, té, refrescos)', draw: (x) => {
      x += 2;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); doc.setTextColor(...PDF_C.tinta);
      for (const [i, o] of ['Sí', 'No'].entries()) {
        if (i) { doc.text('/', x, y); x += doc.getTextWidth('/ ') + 1; }
        const w = doc.getTextWidth(o);
        doc.text(o, x, y);
        if (d.cafeina === o) { doc.setDrawColor(...PDF_C.rosa); doc.setLineWidth(0.4); doc.ellipse(x + w / 2, y - lh * 0.3, w / 2 + 1.6, lh * 0.55); }
        x += w + 3;
      }
      return x;
    } },
    { label: 'Cantidad', value: d.cafeinaCantidad, min: 25 },
  ], y, fs);
  y += 1;

  seccion('Actividad física y movimiento');
  tabla(['Tipo de actividad', 'Duración', 'Intensidad', 'Sensación corporal posterior'],
    [[d['actividad.tipo'], d['actividad.duracion'], d['actividad.intensidad'], d['actividad.sensacion']].map((x) => x || '')], 8 * k);

  seccion('Descanso y estado nervioso');
  tabla(['Horas de sueño', 'Calidad del sueño', 'Nivel de estrés (0-10)'],
    [[d['sueno.horas'], d['sueno.calidad'], d.estres].map((x) => x || '')], 8 * k);

  seccion('Señales del cuerpo y observaciones');
  doc.setFont('times', 'italic'); doc.setFontSize(fs - 0.5); doc.setTextColor(...PDF_C.suave);
  doc.text('(Energía, estado de ánimo, dolor pélvico, molestias digestivas, hinchazón, flujo cervical, antojos, etc.)', PDF_M, y + 2.5);
  y += 4.5;

  // Recuadro de observaciones con renglones; ocupa hasta el final de la hoja
  doc.setFont('helvetica', 'normal'); doc.setFontSize(fs);
  const ancho = PDF_W - 2 * PDF_M;
  const lineas = doc.splitTextToSize(d.observaciones || '', ancho - 6);
  const renglon = Math.max(lh * 1.45, 4.2);
  const necesario = lineas.length * renglon + 3;
  const fin = PDF_H - PDF_M;
  const alto = Math.max(necesario, fin - y, 0);
  doc.setDrawColor(...PDF_C.raya); doc.setLineWidth(0.2);
  for (let ry = y + renglon + 1; ry < y + alto - 1; ry += renglon) doc.line(PDF_M + 1, ry, PDF_M + ancho - 1, ry);
  doc.setDrawColor(...PDF_C.borde); doc.setLineWidth(0.25); doc.rect(PDF_M, y, ancho, alto);
  doc.setTextColor(...PDF_C.tinta);
  lineas.forEach((l, i) => doc.text(l, PDF_M + 3, y + renglon * (i + 1)));

  const cabe = doc.getNumberOfPages() === 1 && y + Math.max(necesario, 18) <= fin;
  return { doc, cabe };
}

async function generarPdf(d, info) {
  let r;
  for (let fs = 9; fs >= 5; fs -= 0.5) { r = construirPdf(d, info, fs); if (r.cabe) break; }
  const doc = r.doc;
  if (info.marcaAgua) {
    const png = await marcaAguaPng(info.marcaAgua);
    if (png) {
      doc.setPage(1);
      doc.setGState(new doc.GState({ opacity: 0.28 }));
      doc.addImage(png, 'PNG', (PDF_W - 120) / 2, 95, 120, 120);
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
  }
  return doc;
}

import { elements, showMainMenu, showStatus, showToast, updateProgress } from './ui.js';

const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function triggerDownload(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function parsePageRanges(ranges, maxPage) {
    const result = new Set();
    ranges.split(',').forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(num => parseInt(num.trim()));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= maxPage) result.add(i - 1);
                }
            }
        } else {
            const page = parseInt(part);
            if (!isNaN(page) && page > 0 && page <= maxPage) {
                result.add(page - 1);
            }
        }
    });
    return Array.from(result).sort((a, b) => a - b);
}

export async function mergePdfs() {
    if (elements.fileInput.files.length < 2) return showToast('PDF 파일을 2개 이상 선택해주세요.', 'error');
    showStatus('PDF 파일을 합치는 중입니다...');
    try {
        const mergedPdf = await PDFDocument.create();
        let processed = 0;
        for (const file of elements.fileInput.files) {
            const pdfBytes = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            processed++;
            updateProgress(processed, elements.fileInput.files.length);
        }
        const mergedPdfBytes = await mergedPdf.save();
        triggerDownload(mergedPdfBytes, 'merged.pdf', 'application/pdf');
        showMainMenu();
        showToast('PDF 합치기 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function extractPages() {
    if (!elements.fileInput.files[0] || !elements.textInput.value) return showToast('파일과 추출할 페이지를 입력/선택해주세요.', 'error');
    showStatus('페이지를 추출하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const extractedPdf = await PDFDocument.create();
        const pageIndices = parsePageRanges(elements.textInput.value, pdfDoc.getPageCount());
        if (pageIndices.length === 0) {
            showMainMenu();
            return showToast('유효한 페이지 번호가 없습니다.', 'error');
        }
        const copiedPages = await extractedPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => extractedPdf.addPage(page));
        const extractedPdfBytes = await extractedPdf.save();
        triggerDownload(extractedPdfBytes, 'extracted.pdf', 'application/pdf');
        showMainMenu();
        showToast('페이지 추출 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function deleteReorderPages() {
    if (!elements.fileInput.files[0] || !elements.textInput.value) return showToast('파일과 작업 정보를 입력해주세요.', 'error');
    showStatus('페이지를 수정하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const newPdf = await PDFDocument.create();
        const inputText = elements.textInput.value.toLowerCase();
        let finalPageIndices;

        if (inputText.includes('순서 변경:')) {
            finalPageIndices = parsePageRanges(inputText.split('순서 변경:')[1], pdfDoc.getPageCount());
        } else if (inputText.includes('삭제:')) {
            const toDelete = parsePageRanges(inputText.split('삭제:')[1], pdfDoc.getPageCount());
            finalPageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i).filter(i => !toDelete.includes(i));
        } else {
            showMainMenu();
            return showToast('입력 형식 오류: "순서 변경:" 또는 "삭제:"를 포함해야 합니다.', 'error');
        }

        const copiedPages = await newPdf.copyPages(pdfDoc, finalPageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        const newPdfBytes = await newPdf.save();
        triggerDownload(newPdfBytes, 'modified.pdf', 'application/pdf');
        showMainMenu();
        showToast('페이지 수정 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function addWatermark() {
    if (!elements.fileInput.files[0] || !elements.textInput.value) return showToast('파일과 워터마크 텍스트를 입력해주세요.', 'error');
    showStatus('워터마크를 추가하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText(elements.textInput.value, {
                x: width / 2 - 150, y: height / 2, font: helveticaFont, size: 50,
                color: rgb(0.95, 0.1, 0.1), opacity: 0.2, rotate: degrees(-45),
            });
        }
        const newPdfBytes = await pdfDoc.save();
        triggerDownload(newPdfBytes, 'watermarked.pdf', 'application/pdf');
        showMainMenu();
        showToast('워터마크 추가 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function imagesToPdf() {
    if (elements.fileInput.files.length === 0) return showToast('이미지 파일을 선택해주세요.', 'error');
    showStatus('이미지를 PDF로 변환 중입니다...');
    try {
        const pdfDoc = await PDFDocument.create();
        let processed = 0;
        for (const file of elements.fileInput.files) {
            const imgBytes = await readFileAsArrayBuffer(file);
            const image = await (file.type === 'image/png' ? pdfDoc.embedPng(imgBytes) : pdfDoc.embedJpg(imgBytes));
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            processed++;
            updateProgress(processed, elements.fileInput.files.length);
        }
        const pdfBytes = await pdfDoc.save();
        triggerDownload(pdfBytes, 'from_images.pdf', 'application/pdf');
        showMainMenu();
        showToast('이미지 변환 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function compressPdf() {
    if (!elements.fileInput.files[0]) return showToast('PDF 파일을 선택해주세요.', 'error');
    const quality = parseInt(elements.textInput.value) / 100;
    if (isNaN(quality) || quality <= 0 || quality > 1) return showToast('압축 품질은 1에서 100 사이의 숫자여야 합니다.', 'error');
    showStatus('PDF를 압축하는 중입니다...');
    try {
        const originalBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const pdfDoc = await pdfjsLib.getDocument({ data: originalBytes }).promise;
        const newPdfDoc = await PDFDocument.create();
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            
            const jpgDataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpgBytes = await fetch(jpgDataUrl).then(res => res.arrayBuffer());
            const jpgImage = await newPdfDoc.embedJpg(jpgBytes);

            const newPage = newPdfDoc.addPage([canvas.width, canvas.height]);
            newPage.drawImage(jpgImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
            updateProgress(i, pdfDoc.numPages);
        }
        
        const compressedBytes = await newPdfDoc.save();
        triggerDownload(compressedBytes, 'compressed.pdf', 'application/pdf');
        showMainMenu();
        showToast('PDF 압축 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function unlockPdf() {
    if (!elements.fileInput.files[0]) return showToast('PDF 파일을 선택해주세요.', 'error');
    showStatus('암호를 해제하는 중입니다...');
    try {
        const password = elements.textInput.value;
        const pdfBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { password });
        const unlockedPdfBytes = await pdfDoc.save();
        triggerDownload(unlockedPdfBytes, 'unlocked.pdf', 'application/pdf');
        showMainMenu();
        showToast('암호 해제 완료!', 'success');
    } catch (e) {
        showToast(e.message.includes('password') ? '암호가 잘못되었습니다.' : `오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

export async function addCover() {
    if (!elements.fileInput.files[0] || !elements.fileInput2.files[0]) return showToast('표지 파일과 본문 파일을 모두 선택해주세요.', 'error');
    showStatus('표지를 추가하는 중입니다...');
    try {
        const coverBytes = await readFileAsArrayBuffer(elements.fileInput.files[0]);
        const mainBytes = await readFileAsArrayBuffer(elements.fileInput2.files[0]);
        const coverDoc = await PDFDocument.load(coverBytes, { ignoreEncryption: true });
        const mainDoc = await PDFDocument.load(mainBytes, { ignoreEncryption: true });
        const mergedPdf = await PDFDocument.create();
        const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
        coverPages.forEach(page => mergedPdf.addPage(page));
        const mainPages = await mergedPdf.copyPages(mainDoc, mainDoc.getPageIndices());
        mainPages.forEach(page => mergedPdf.addPage(page));
        const mergedPdfBytes = await mergedPdf.save();
        triggerDownload(mergedPdfBytes, 'with_cover.pdf', 'application/pdf');
        showMainMenu();
        showToast('표지 추가 완료!', 'success');
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
        showMainMenu();
    }
}

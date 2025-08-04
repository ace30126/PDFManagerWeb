// pdf.js 워커 경로 설정
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
}

// 전역 변수
const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
const mainMenu = document.getElementById('main-menu');
const operationView = document.getElementById('operation-view');
const operationTitle = document.getElementById('operation-title');
const homeButton = document.getElementById('home-button');
const fileDropZone = document.getElementById('file-drop-zone');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('file-label');
const fileList = document.getElementById('file-list');
const fileInputContainer2 = document.getElementById('file-input-container-2');
const fileInput2 = document.getElementById('file-input-2');
const fileLabel2 = document.getElementById('file-label-2');
const additionalInputs = document.getElementById('additional-inputs');
const inputLabel = document.getElementById('input-label');
const textInput = document.getElementById('text-input');
const applyButton = document.getElementById('apply-button');
const statusContainer = document.getElementById('status-container');
const statusMessage = document.getElementById('status-message');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const logContainer = document.getElementById('log-container');
const logOutput = document.getElementById('log-output');
const previewContainer = document.getElementById('preview-container');
const previewArea = document.getElementById('preview-area');
const previewPlaceholder = document.getElementById('preview-placeholder');
const toastContainer = document.getElementById('toast-container');
const operationGrid = document.getElementById('operation-grid');

let currentOperation = null;
let sortable = null;

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    fileDropZone.addEventListener('click', () => fileInput.click());
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });
    fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('dragover'));
    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        fileInput.files = e.dataTransfer.files;
        handleFileSelection(fileInput.files);
    });
    fileInput.addEventListener('change', () => handleFileSelection(fileInput.files));
}

function handleFileSelection(files) {
    if (files.length === 0) return;
    
    const names = Array.from(files).map(f => f.name).join(', ');
    fileList.textContent = names;

    const operationsWithPreview = ['extract', 'deleteReorder', 'addWatermark', 'compress'];
    if (operationsWithPreview.includes(currentOperation) && files[0].type === 'application/pdf') {
        displayPdfPreview(files[0]);
    } else if (currentOperation === 'imageToPdf') {
        displayImagePreview(files);
    }
}

// --- UI 관리 함수 ---
function setupUI(operation) {
    currentOperation = operation;
    mainMenu.classList.add('hidden');
    operationView.classList.remove('hidden');
    homeButton.classList.remove('hidden');
    
    // UI 초기화
    fileInput.value = '';
    fileInput2.value = '';
    textInput.value = '';
    fileList.textContent = '';
    fileInput.removeAttribute('multiple');
    fileInput.accept = 'application/pdf';
    fileInputContainer2.classList.add('hidden');
    additionalInputs.classList.add('hidden');
    previewArea.innerHTML = '';
    previewPlaceholder.classList.remove('hidden');
    textInput.type = 'text';

    // 현재 작업 제목 스타일링
    operationTitle.className = 'text-2xl font-bold text-blue-800 mb-4 p-4 bg-blue-100 rounded-lg text-center';

    log(`새로운 작업을 시작합니다: ${operation}`);

    const operationsWithPreview = ['extract', 'deleteReorder', 'addWatermark', 'compress', 'imageToPdf'];
    const controlPane = operationGrid.firstElementChild;

    // 레이아웃 제어 로직
    if (operationsWithPreview.includes(operation)) {
        previewContainer.classList.remove('hidden'); // 미리보기 창 보이기
        controlPane.classList.remove('md:col-span-5'); // 작업 영역이 전체를 차지하는 클래스 제거
        controlPane.classList.add('md:col-span-2'); // 작업 영역이 2칸을 차지하도록 설정
    } else {
        previewContainer.classList.add('hidden'); // 미리보기 창 숨기기
        controlPane.classList.remove('md:col-span-2'); // 작업 영역이 2칸을 차지하는 클래스 제거
        controlPane.classList.add('md:col-span-5'); // 작업 영역이 전체(5칸)를 차지하도록 설정
    }

    switch (operation) {
        case 'merge':
            operationTitle.textContent = 'PDF 파일 합치기';
            fileLabel.textContent = '여기에 PDF 파일들을 드롭하거나 클릭하여 선택';
            fileInput.setAttribute('multiple', true);
            applyButton.onclick = mergePdfs;
            break;
        case 'extract':
            operationTitle.textContent = '페이지 추출';
            additionalInputs.classList.remove('hidden');
            inputLabel.textContent = '추출할 페이지를 선택하거나 직접 입력하세요.';
            textInput.placeholder = '예: 1, 3-5, 8';
            applyButton.onclick = extractPages;
            break;
        case 'deleteReorder':
            operationTitle.textContent = '페이지 삭제/순서 변경';
            additionalInputs.classList.remove('hidden');
            inputLabel.textContent = '페이지 순서를 드래그하거나, 삭제할 페이지를 선택하세요.';
            textInput.placeholder = '삭제할 페이지는 클릭하여 선택';
            applyButton.onclick = deleteReorderPages;
            break;
        case 'addWatermark':
            operationTitle.textContent = '워터마크 추가';
            additionalInputs.classList.remove('hidden');
            inputLabel.textContent = '추가할 워터마크 텍스트를 입력하세요.';
            textInput.placeholder = '예: CONFIDENTIAL';
            applyButton.onclick = addWatermark;
            break;
        case 'imageToPdf':
            operationTitle.textContent = '이미지를 PDF로 변환';
            fileLabel.textContent = '여기에 이미지 파일(JPG, PNG)들을 드롭하거나 클릭';
            fileInput.accept = 'image/jpeg, image/png';
            fileInput.setAttribute('multiple', true);
            applyButton.onclick = imagesToPdf;
            break;
        case 'compress':
            operationTitle.textContent = 'PDF 압축';
            additionalInputs.classList.remove('hidden');
            inputLabel.textContent = '압축 품질 (1-100, 낮을수록 용량 작아짐)';
            textInput.type = 'number';
            textInput.value = '75';
            textInput.placeholder = '75';
            applyButton.onclick = compressPdf;
            break;
        case 'unlock':
            operationTitle.textContent = 'PDF 암호 해제';
            additionalInputs.classList.remove('hidden');
            inputLabel.textContent = 'PDF 암호를 입력하세요.';
            textInput.type = 'password';
            applyButton.onclick = unlockPdf;
            break;
        case 'addCover':
            operationTitle.textContent = '표지 추가';
            fileInputContainer2.classList.remove('hidden');
            fileLabel2.textContent = '본문 PDF 파일을 선택하세요';
            applyButton.onclick = addCover;
            break;
    }
}

function showMainMenu() {
    operationView.classList.add('hidden');
    homeButton.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    hideStatus();
    logContainer.classList.add('hidden');
    logOutput.textContent = '';
    // 제목 스타일 초기화
    operationTitle.className = 'text-2xl font-bold text-gray-700 mb-4';
}

function showStatus(message) {
    statusMessage.textContent = message;
    statusContainer.classList.remove('hidden');
    operationView.classList.add('hidden');
    mainMenu.classList.add('hidden');
}

function hideStatus() {
    statusContainer.classList.add('hidden');
    progressBarContainer.classList.add('hidden');
}

function updateProgress(value, total) {
    const percent = Math.round((value / total) * 100);
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 미리보기 기능 ---
async function displayPdfPreview(file) {
    previewArea.innerHTML = '<p class="col-span-full text-center text-gray-500">미리보기 생성 중...</p>';
    previewPlaceholder.classList.add('hidden');

    try {
        const pdfBytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        previewArea.innerHTML = '';

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.4 });
            
            const pageDiv = document.createElement('div');
            pageDiv.className = 'preview-page p-1 rounded-lg shadow';
            pageDiv.dataset.pageNumber = i;

            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const pageNumberLabel = document.createElement('p');
            pageNumberLabel.className = 'text-center text-xs font-bold mb-1';
            pageNumberLabel.textContent = `Page ${i}`;

            pageDiv.appendChild(canvas);
            pageDiv.appendChild(pageNumberLabel);
            previewArea.appendChild(pageDiv);

            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

            pageDiv.addEventListener('click', () => {
                pageDiv.classList.toggle('selected');
                updateTextInputFromSelection();
            });
        }
        
        if (currentOperation === 'deleteReorder') {
            if (sortable) sortable.destroy();
            sortable = new Sortable(previewArea, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: () => updateTextInputFromSelection(true)
            });
        }

    } catch (e) {
        previewArea.innerHTML = `<p class="col-span-full text-center text-red-500">미리보기 오류: ${e.message}</p>`;
        log(`미리보기 오류: ${e.message}`);
    }
}

async function displayImagePreview(files) {
    previewArea.innerHTML = '';
    previewPlaceholder.classList.add('hidden');
    for(const file of files) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'preview-page p-1 rounded-lg shadow';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'w-full h-auto';
        pageDiv.appendChild(img);
        previewArea.appendChild(pageDiv);
    }
}

function updateTextInputFromSelection(isReorder = false) {
    const selectedPages = Array.from(previewArea.querySelectorAll('.preview-page.selected'))
        .map(p => p.dataset.pageNumber)
        .join(',');
    
    const allPages = Array.from(previewArea.querySelectorAll('.preview-page'))
        .map(p => p.dataset.pageNumber)
        .join(',');

    if (currentOperation === 'extract') {
        textInput.value = selectedPages;
    } else if (currentOperation === 'deleteReorder') {
        if (isReorder) {
            textInput.value = `순서 변경: ${allPages}`;
        } else {
            textInput.value = `삭제: ${selectedPages}`;
        }
    }
}

// --- 핵심 PDF 작업 함수들 ---

async function mergePdfs() {
    if (fileInput.files.length < 2) return showToast('PDF 파일을 2개 이상 선택해주세요.', 'error');
    showStatus('PDF 파일을 합치는 중입니다...');
    try {
        const mergedPdf = await PDFDocument.create();
        let processed = 0;
        for (const file of fileInput.files) {
            log(`처리 중: ${file.name}`);
            const pdfBytes = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            processed++;
            updateProgress(processed, fileInput.files.length);
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

async function extractPages() {
    if (!fileInput.files[0] || !textInput.value) return showToast('파일과 추출할 페이지를 입력/선택해주세요.', 'error');
    showStatus('페이지를 추출하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const extractedPdf = await PDFDocument.create();
        const pageIndices = parsePageRanges(textInput.value, pdfDoc.getPageCount());
        if (pageIndices.length === 0) return showToast('유효한 페이지 번호가 없습니다.', 'error');
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

async function deleteReorderPages() {
    if (!fileInput.files[0] || !textInput.value) return showToast('파일과 작업 정보를 입력해주세요.', 'error');
    showStatus('페이지를 수정하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const newPdf = await PDFDocument.create();
        const inputText = textInput.value.toLowerCase();
        let finalPageIndices;

        if (inputText.includes('순서 변경:')) {
            finalPageIndices = parsePageRanges(inputText.split('순서 변경:')[1], pdfDoc.getPageCount());
        } else if (inputText.includes('삭제:')) {
            const toDelete = parsePageRanges(inputText.split('삭제:')[1], pdfDoc.getPageCount());
            finalPageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i).filter(i => !toDelete.includes(i));
        } else {
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

async function addWatermark() {
    if (!fileInput.files[0] || !textInput.value) return showToast('파일과 워터마크 텍스트를 입력해주세요.', 'error');
    showStatus('워터마크를 추가하는 중입니다...');
    try {
        const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText(textInput.value, {
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

async function imagesToPdf() {
    if (fileInput.files.length === 0) return showToast('이미지 파일을 선택해주세요.', 'error');
    showStatus('이미지를 PDF로 변환 중입니다...');
    try {
        const pdfDoc = await PDFDocument.create();
        let processed = 0;
        for (const file of fileInput.files) {
            const imgBytes = await readFileAsArrayBuffer(file);
            const image = await (file.type === 'image/png' ? pdfDoc.embedPng(imgBytes) : pdfDoc.embedJpg(imgBytes));
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            processed++;
            updateProgress(processed, fileInput.files.length);
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

async function compressPdf() {
    if (!fileInput.files[0]) return showToast('PDF 파일을 선택해주세요.', 'error');
    const quality = parseInt(textInput.value) / 100;
    if (isNaN(quality) || quality <= 0 || quality > 1) return showToast('압축 품질은 1에서 100 사이의 숫자여야 합니다.', 'error');
    showStatus('PDF를 압축하는 중입니다...');
    try {
        const originalBytes = await readFileAsArrayBuffer(fileInput.files[0]);
        const pdfDoc = await pdfjsLib.getDocument({ data: originalBytes }).promise;
        const newPdfDoc = await PDFDocument.create();
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            
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

// --- 유틸리티 함수 ---
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

// --- 기타 레거시 함수 (unlock, addCover) ---
async function unlockPdf() {
    if (!fileInput.files[0]) return showToast('PDF 파일을 선택해주세요.', 'error');
    showStatus('암호를 해제하는 중입니다...');
    try {
        const password = textInput.value;
        const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
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

async function addCover() {
    if (!fileInput.files[0] || !fileInput2.files[0]) return showToast('표지 파일과 본문 파일을 모두 선택해주세요.', 'error');
    showStatus('표지를 추가하는 중입니다...');
    try {
        const coverBytes = await readFileAsArrayBuffer(fileInput.files[0]);
        const mainBytes = await readFileAsArrayBuffer(fileInput2.files[0]);
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

// 초기화
document.addEventListener('DOMContentLoaded', setupEventListeners);

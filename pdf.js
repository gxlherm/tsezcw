// Implementação da geração de PDF e funcionalidades relacionadas
class PDFGenerator {
    constructor() {
        // Verificar se as bibliotecas necessárias estão disponíveis
        if (typeof window.jspdf === 'undefined') {
            console.error('Erro: Biblioteca jsPDF não carregada!');
            alert('Erro ao carregar biblioteca de geração de PDF. Por favor, recarregue a página.');
            return;
        }
        
        if (typeof window.html2canvas === 'undefined') {
            console.error('Erro: Biblioteca html2canvas não carregada!');
            alert('Erro ao carregar biblioteca de captura de tela. Por favor, recarregue a página.');
            return;
        }
        
        this.jsPDF = window.jspdf.jsPDF;
        this.html2canvas = window.html2canvas;
    }
    
    // Gerar PDF a partir de um elemento HTML
    async generatePDF(element, filename = 'guia_encaminhamento.pdf') {
        try {
            // Configurações para formato A4
            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Capturar o elemento como imagem
            const canvas = await this.html2canvas(element, {
                scale: 2, // Melhor qualidade
                useCORS: true,
                logging: false
            });
            
            // Dimensões do PDF A4 (210mm x 297mm)
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Adicionar a imagem ao PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            // Salvar o PDF
            pdf.save(filename);
            
            return true;
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            return false;
        }
    }
    
    // Pré-visualizar a guia antes de gerar o PDF
    previewGuia(colaboradorData, exames, riscos, empresaData) {
        // Limpar a área de visualização
        const previewArea = document.getElementById('guia-preview');
        if (!previewArea) return false;
        
        // Criar a estrutura da guia
        const guiaHTML = this.createGuiaHTML(colaboradorData, exames, riscos, empresaData);
        
        // Inserir no DOM
        previewArea.innerHTML = guiaHTML;
        
        // Mostrar o modal de pré-visualização
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
        
        return true;
    }
    
    // Criar o HTML da guia
    createGuiaHTML(colaboradorData, exames, riscos, empresaData) {
        // Formatar data atual
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
        
        // Formatar data de nascimento
        let dataNascimento = '';
        if (colaboradorData.dataNascimento) {
            const dataNasc = new Date(colaboradorData.dataNascimento);
            dataNascimento = dataNasc.toLocaleDateString('pt-BR');
        }
        
        // Formatar data de admissão
        let dataAdmissao = '';
        if (colaboradorData.dataAdmissao) {
            const dataAdm = new Date(colaboradorData.dataAdmissao);
            dataAdmissao = dataAdm.toLocaleDateString('pt-BR');
        }
        
        // Organizar riscos por tipo
        const riscosPorTipo = {
            fisico: [],
            quimico: [],
            biologico: [],
            ergonomico: [],
            acidentes: []
        };
        
        riscos.forEach(risco => {
            if (riscosPorTipo[risco.tipo]) {
                riscosPorTipo[risco.tipo].push(risco.descricao);
            }
        });
        
        // Tradução dos tipos de risco
        const tiposRiscoTraduzidos = {
            fisico: 'Físicos',
            quimico: 'Químicos',
            biologico: 'Biológicos',
            ergonomico: 'Ergonômicos',
            acidentes: 'Acidentes'
        };
        
        // Criar HTML para os riscos
        let riscosHTML = '';
        for (const tipo in riscosPorTipo) {
            if (riscosPorTipo[tipo].length > 0) {
                riscosHTML += `
                    <div class="mb-2">
                        <strong>${tiposRiscoTraduzidos[tipo]}:</strong>
                        <div>${riscosPorTipo[tipo].join('; ')}</div>
                    </div>
                `;
            }
        }
        
        // Criar HTML para os exames
        let examesHTML = '';
        exames.forEach(exame => {
            examesHTML += `
                <div class="mb-1">
                    <div>${exame.nome}</div>
                    ${exame.recomendacao ? `<small class="text-muted">${exame.recomendacao}</small>` : ''}
                </div>
            `;
        });
        
        // Criar HTML completo da guia
        return `
            <div class="guia-container">
                <div class="guia-header">
                    <div class="row">
                        <div class="col-8">
                            <h4>${empresaData.nome || 'Empresa'}</h4>
                            <p class="mb-0">CNPJ: ${empresaData.cnpj || ''}</p>
                            <p class="mb-0">${empresaData.endereco || ''}</p>
                            <p class="mb-0">Tel: ${empresaData.telefone || ''} | Email: ${empresaData.email || ''}</p>
                        </div>
                        <div class="col-4 text-end">
                            <h5>GUIA DE ENCAMINHAMENTO</h5>
                            <p>Data: ${dataFormatada}</p>
                        </div>
                    </div>
                    <hr>
                </div>
                
                <div class="guia-body">
                    <h5 class="text-center mb-3">DADOS DO COLABORADOR</h5>
                    
                    <div class="row mb-3">
                        <div class="col-8">
                            <strong>Nome:</strong> ${colaboradorData.nome || ''}
                        </div>
                        <div class="col-4">
                            <strong>Sexo:</strong> ${colaboradorData.sexo || ''}
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-4">
                            <strong>CPF:</strong> ${colaboradorData.cpf || ''}
                        </div>
                        <div class="col-4">
                            <strong>RG:</strong> ${colaboradorData.rg || ''}
                        </div>
                        <div class="col-4">
                            <strong>Data Nasc.:</strong> ${dataNascimento}
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-4">
                            <strong>Função:</strong> ${colaboradorData.funcaoNome || ''}
                        </div>
                        <div class="col-4">
                            <strong>Setor:</strong> ${colaboradorData.setor || ''}
                        </div>
                        <div class="col-4">
                            <strong>Data Adm.:</strong> ${dataAdmissao}
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-8">
                            <strong>Obra/Local:</strong> ${colaboradorData.obra || ''}
                        </div>
                        <div class="col-4">
                            <strong>Matrícula:</strong> ${colaboradorData.matricula || ''}
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-12">
                            <strong>Tipo de Exame:</strong> ${colaboradorData.tipoExameNome || ''}
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="row">
                        <div class="col-6">
                            <h5 class="mb-3">EXAMES SOLICITADOS</h5>
                            <div>${examesHTML || 'Nenhum exame selecionado'}</div>
                        </div>
                        
                        <div class="col-6">
                            <h5 class="mb-3">RISCOS OCUPACIONAIS</h5>
                            <div>${riscosHTML || 'Nenhum risco identificado'}</div>
                        </div>
                    </div>
                    
                    <div class="assinatura-box mt-5">
                        <div class="row">
                            <div class="col-6 text-center">
                                <div class="border-top pt-2">
                                    Médico Coordenador do PCMSO<br>
                                    ${empresaData.medicoNome || ''}<br>
                                    ${empresaData.medicoCrm || ''}
                                </div>
                            </div>
                            <div class="col-6 text-center">
                                <div class="border-top pt-2">
                                    Assinatura do Colaborador
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Criar instância global do gerador de PDF
const pdfGenerator = new PDFGenerator();

// Exportar a instância
window.pdfGenerator = pdfGenerator;

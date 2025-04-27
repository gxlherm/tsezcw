// Aplicação principal
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se as bibliotecas necessárias estão disponíveis
    if (typeof bootstrap === 'undefined') {
        console.error('Erro: Biblioteca Bootstrap não carregada!');
        alert('Erro ao carregar biblioteca de interface. Por favor, recarregue a página.');
        return;
    }
    
    // Inicializar tooltips e popovers do Bootstrap
    try {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    } catch (error) {
        console.error('Erro ao inicializar componentes Bootstrap:', error);
    }
    
    // Inicializar o banco de dados antes de qualquer operação
    try {
        await db.inicializarDadosPadrao();
        console.log('Banco de dados inicializado com sucesso no carregamento da página');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        showToast('Erro ao inicializar banco de dados. Tente recarregar a página.', 'danger');
    }
    
    // Verificar autenticação
    checkAuth();
    
    // Adicionar event listeners
    document.getElementById('formLogin').addEventListener('submit', handleLogin);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('formGuia').addEventListener('submit', handleFormGuia);
    document.getElementById('btnLimparForm').addEventListener('click', limparFormulario);
    document.getElementById('btnConfig').addEventListener('click', toggleConfigPanel);
    document.getElementById('formConfig').addEventListener('submit', saveConfig);
    document.getElementById('btnPrevisualizar').addEventListener('click', previewGuia);
    
    // Adicionar event listeners para navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!auth.isAuthenticated()) return;
            
            const target = e.target.getAttribute('data-target');
            if (target) {
                showSection(target);
            }
        });
    });
    
    // Adicionar event listeners para seleção de função e tipo de exame
    document.getElementById('funcao').addEventListener('change', handleFuncaoChange);
    document.getElementById('tipoExame').addEventListener('change', handleTipoExameChange);
    
    // Adicionar máscara para o campo de CPF
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
        }
        
        e.target.value = value;
    });
    
    // Inicializar o sistema de administração se o usuário for administrador
    if (auth.isAuthenticated() && auth.isAdmin()) {
        await adminSystem.loadInitialData();
    }
    
    // Adicionar listener para o evento de inicialização do banco de dados
    document.addEventListener('db-initialized', () => {
        console.log('Evento de inicialização do banco de dados recebido');
        if (auth.isAuthenticated()) {
            loadFormData();
        }
    });
});

// Verificar autenticação
function checkAuth() {
    if (auth.isAuthenticated()) {
        // Mostrar nome do usuário
        document.getElementById('currentUser').textContent = auth.getCurrentUser().nome;
        
        // Mostrar ou ocultar opções de administração
        if (auth.isAdmin()) {
            document.getElementById('adminNav').style.display = 'block';
        } else {
            document.getElementById('adminNav').style.display = 'none';
        }
        
        // Mostrar conteúdo principal
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        
        // Mostrar seção inicial
        showSection('form');
        
        // Carregar dados iniciais
        loadInitialData();
    } else {
        // Mostrar login
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainContainer').style.display = 'none';
    }
}

// Lidar com login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('Preencha todos os campos', 'warning');
        return;
    }
    
    try {
        // Garantir que o banco de dados esteja inicializado antes do login
        if (!db.isInitialized) {
            console.log('Inicializando banco de dados antes do login...');
            await db.inicializarDadosPadrao();
        }
        
        const loginSuccess = await auth.login(username, password);
        
        if (loginSuccess) {
            showToast('Login realizado com sucesso', 'success');
            
            // Pequeno atraso para garantir que o banco de dados esteja pronto
            setTimeout(() => {
                checkAuth();
                console.log('Autenticação verificada após login');
            }, 500);
        } else {
            showToast('Usuário ou senha inválidos', 'danger');
        }
    } catch (error) {
        console.error('Erro durante o processo de login:', error);
        showToast('Erro ao processar login. Tente novamente.', 'danger');
    }
}

// Lidar com logout
function handleLogout() {
    auth.logout();
    checkAuth();
    showToast('Logout realizado com sucesso', 'success');
}

// Mostrar seção
function showSection(section) {
    try {
        console.log(`Mostrando seção: ${section}`);
        
        // Ocultar todas as seções
        document.querySelectorAll('.content-section').forEach(el => {
            el.style.display = 'none';
        });
        
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active');
        });
        
        // Verificar se a seção existe
        const sectionElement = document.getElementById(`section-${section}`);
        if (!sectionElement) {
            console.error(`Seção não encontrada: section-${section}`);
            return;
        }
        
        // Mostrar seção selecionada
        sectionElement.style.display = 'block';
        
        // Verificar se o link existe antes de adicionar a classe
        const linkElement = document.querySelector(`.nav-link[data-target="${section}"]`);
        if (linkElement) {
            linkElement.classList.add('active');
        }
        
        // Ações específicas para cada seção
        if (section === 'form') {
            // Pequeno atraso para garantir que a seção esteja visível antes de carregar os dados
            setTimeout(() => {
                loadFormData();
            }, 300);
        } else if (section === 'historico') {
            loadHistorico();
        } else if (section === 'admin') {
            if (auth.isAdmin()) {
                adminSystem.loadInitialData();
            } else {
                showSection('form');
                showToast('Acesso negado', 'danger');
            }
        }
    } catch (error) {
        console.error('Erro ao mostrar seção:', error);
        showToast('Erro ao carregar a seção', 'danger');
    }
}

// Carregar dados iniciais
async function loadInitialData() {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Carregar dados da empresa
        const empresa = await db.empresas.toArray();
        if (empresa.length > 0) {
            document.getElementById('empresaNome').value = empresa[0].nome || '';
            document.getElementById('empresaCnpj').value = empresa[0].cnpj || '';
            document.getElementById('empresaTelefone').value = empresa[0].telefone || '';
            document.getElementById('empresaEmail').value = empresa[0].email || '';
            document.getElementById('empresaEndereco').value = empresa[0].endereco || '';
            document.getElementById('medicoNome').value = empresa[0].medicoNome || '';
            document.getElementById('medicoCrm').value = empresa[0].medicoCrm || '';
        }
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showToast('Erro ao carregar dados iniciais', 'danger');
    }
}

// Carregar dados do formulário
async function loadFormData() {
    try {
        console.log('Iniciando carregamento de dados do formulário...');
        
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            console.log('Banco de dados não inicializado, inicializando agora...');
            await db.inicializarDadosPadrao();
        }
        
        // Verificar se os elementos existem antes de manipulá-los
        const selectFuncao = document.getElementById('funcao');
        const selectTipoExame = document.getElementById('tipoExame');
        
        if (!selectFuncao || !selectTipoExame) {
            console.error('Elementos do formulário não encontrados');
            return;
        }
        
        // Carregar funções
        console.log('Carregando funções...');
        const funcoes = await db.funcoes.where('ativa').equals(true).toArray();
        selectFuncao.innerHTML = '<option value="">Selecione uma função</option>';
        
        funcoes.forEach(funcao => {
            const option = document.createElement('option');
            option.value = funcao.id;
            option.textContent = funcao.nome;
            selectFuncao.appendChild(option);
        });
        
        // Carregar tipos de exame
        console.log('Carregando tipos de exame...');
        const tiposExame = await db.tiposExame.where('ativo').equals(true).toArray();
        selectTipoExame.innerHTML = '<option value="">Selecione um tipo de exame</option>';
        
        tiposExame.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nome;
            selectTipoExame.appendChild(option);
        });
        
        console.log('Dados do formulário carregados com sucesso');
    } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error);
        showToast('Erro ao carregar dados do formulário', 'danger');
    }
}

// Lidar com mudança de função
async function handleFuncaoChange() {
    const funcaoId = document.getElementById('funcao').value;
    const tipoExameId = document.getElementById('tipoExame').value;
    
    if (funcaoId && tipoExameId) {
        await loadExamesERiscos(funcaoId, tipoExameId);
    }
}

// Lidar com mudança de tipo de exame
async function handleTipoExameChange() {
    const funcaoId = document.getElementById('funcao').value;
    const tipoExameId = document.getElementById('tipoExame').value;
    
    if (funcaoId && tipoExameId) {
        await loadExamesERiscos(funcaoId, tipoExameId);
    }
}

// Carregar exames e riscos
async function loadExamesERiscos(funcaoId, tipoExameId) {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        const result = await db.obterExamesPorFuncaoETipo(parseInt(funcaoId), parseInt(tipoExameId));
        
        // Exibir exames e riscos no formulário
        const examesContainer = document.getElementById('examesContainer');
        const riscosContainer = document.getElementById('riscosContainer');
        
        examesContainer.innerHTML = '';
        riscosContainer.innerHTML = '';
        
        if (result.exames.length === 0) {
            examesContainer.innerHTML = '<p class="text-center">Nenhum exame configurado para esta combinação</p>';
        } else {
            const ul = document.createElement('ul');
            ul.className = 'list-group';
            
            result.exames.forEach(exame => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div>${exame.nome}</div>
                    ${exame.recomendacao ? `<small class="text-muted">${exame.recomendacao}</small>` : ''}
                `;
                ul.appendChild(li);
            });
            
            examesContainer.appendChild(ul);
        }
        
        if (result.riscos.length === 0) {
            riscosContainer.innerHTML = '<p class="text-center">Nenhum risco configurado para esta combinação</p>';
        } else {
            // Agrupar riscos por tipo
            const riscosPorTipo = {};
            result.riscos.forEach(risco => {
                if (!riscosPorTipo[risco.tipo]) {
                    riscosPorTipo[risco.tipo] = [];
                }
                riscosPorTipo[risco.tipo].push(risco);
            });
            
            // Tradução dos tipos de risco
            const tiposRiscoTraduzidos = {
                fisico: 'Físicos',
                quimico: 'Químicos',
                biologico: 'Biológicos',
                ergonomico: 'Ergonômicos',
                acidentes: 'Acidentes'
            };
            
            // Criar lista de riscos agrupados por tipo
            for (const tipo in riscosPorTipo) {
                const tipoDiv = document.createElement('div');
                tipoDiv.className = 'mb-3';
                tipoDiv.innerHTML = `<h6>${tiposRiscoTraduzidos[tipo] || tipo}</h6>`;
                
                const ul = document.createElement('ul');
                ul.className = 'list-group';
                
                riscosPorTipo[tipo].forEach(risco => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = risco.descricao;
                    ul.appendChild(li);
                });
                
                tipoDiv.appendChild(ul);
                riscosContainer.appendChild(tipoDiv);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar exames e riscos:', error);
        showToast('Erro ao carregar exames e riscos', 'danger');
    }
}

// Lidar com envio do formulário
async function handleFormGuia(e) {
    e.preventDefault();
    
    // Obter dados do formulário
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const rg = document.getElementById('rg').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;
    const sexo = document.getElementById('sexo').value;
    const setor = document.getElementById('setor').value.trim();
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const obra = document.getElementById('obra').value.trim();
    const matricula = document.getElementById('matricula').value.trim();
    const funcaoId = document.getElementById('funcao').value;
    const tipoExameId = document.getElementById('tipoExame').value;
    
    // Validar campos obrigatórios
    if (!nome || !cpf || !funcaoId || !tipoExameId) {
        showToast('Preencha os campos obrigatórios', 'warning');
        return;
    }
    
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Obter nomes da função e tipo de exame
        const funcao = await db.funcoes.get(parseInt(funcaoId));
        const tipoExame = await db.tiposExame.get(parseInt(tipoExameId));
        
        // Obter exames e riscos
        const result = await db.obterExamesPorFuncaoETipo(parseInt(funcaoId), parseInt(tipoExameId));
        
        // Salvar colaborador
        const colaboradorId = await db.colaboradores.add({
            nome,
            cpf,
            rg,
            dataNascimento,
            sexo,
            setor,
            dataAdmissao,
            obra,
            matricula,
            funcaoId: parseInt(funcaoId),
            tipoExameId: parseInt(tipoExameId)
        });
        
        // Salvar guia
        await db.guias.add({
            colaboradorId,
            funcaoId: parseInt(funcaoId),
            tipoExameId: parseInt(tipoExameId),
            dataCriacao: new Date(),
            usuarioId: auth.getCurrentUser().id
        });
        
        // Preparar dados para a guia
        const colaboradorData = {
            nome,
            cpf,
            rg,
            dataNascimento,
            sexo,
            setor,
            dataAdmissao,
            obra,
            matricula,
            funcaoNome: funcao.nome,
            tipoExameNome: tipoExame.nome
        };
        
        // Obter dados da empresa
        const empresas = await db.empresas.toArray();
        const empresaData = empresas.length > 0 ? empresas[0] : {};
        
        // Gerar PDF
        const guiaElement = document.getElementById('guia-preview');
        pdfGenerator.previewGuia(colaboradorData, result.exames, result.riscos, empresaData);
        
        showToast('Guia gerada com sucesso', 'success');
        
        // Limpar formulário
        limparFormulario();
        
        // Mostrar modal de pré-visualização
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
    } catch (error) {
        console.error('Erro ao gerar guia:', error);
        showToast('Erro ao gerar guia', 'danger');
    }
}

// Pré-visualizar guia
async function previewGuia() {
    // Obter dados do formulário
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const rg = document.getElementById('rg').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;
    const sexo = document.getElementById('sexo').value;
    const setor = document.getElementById('setor').value.trim();
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const obra = document.getElementById('obra').value.trim();
    const matricula = document.getElementById('matricula').value.trim();
    const funcaoId = document.getElementById('funcao').value;
    const tipoExameId = document.getElementById('tipoExame').value;
    
    // Validar campos obrigatórios
    if (!nome || !cpf || !funcaoId || !tipoExameId) {
        showToast('Preencha os campos obrigatórios', 'warning');
        return;
    }
    
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Obter nomes da função e tipo de exame
        const funcao = await db.funcoes.get(parseInt(funcaoId));
        const tipoExame = await db.tiposExame.get(parseInt(tipoExameId));
        
        // Obter exames e riscos
        const result = await db.obterExamesPorFuncaoETipo(parseInt(funcaoId), parseInt(tipoExameId));
        
        // Preparar dados para a guia
        const colaboradorData = {
            nome,
            cpf,
            rg,
            dataNascimento,
            sexo,
            setor,
            dataAdmissao,
            obra,
            matricula,
            funcaoNome: funcao.nome,
            tipoExameNome: tipoExame.nome
        };
        
        // Obter dados da empresa
        const empresas = await db.empresas.toArray();
        const empresaData = empresas.length > 0 ? empresas[0] : {};
        
        // Mostrar pré-visualização
        pdfGenerator.previewGuia(colaboradorData, result.exames, result.riscos, empresaData);
        
        // Mostrar modal de pré-visualização
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
    } catch (error) {
        console.error('Erro ao pré-visualizar guia:', error);
        showToast('Erro ao pré-visualizar guia', 'danger');
    }
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('formGuia').reset();
    document.getElementById('examesContainer').innerHTML = '';
    document.getElementById('riscosContainer').innerHTML = '';
}

// Carregar histórico
async function loadHistorico() {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Obter guias
        const guias = await db.guias.toArray();
        
        // Obter dados adicionais
        const guiasCompletas = [];
        
        for (const guia of guias) {
            const colaborador = await db.colaboradores.get(guia.colaboradorId);
            const funcao = await db.funcoes.get(guia.funcaoId);
            const tipoExame = await db.tiposExame.get(guia.tipoExameId);
            
            guiasCompletas.push({
                ...guia,
                colaborador,
                funcaoNome: funcao.nome,
                tipoExameNome: tipoExame.nome
            });
        }
        
        // Ordenar por data de criação (mais recente primeiro)
        guiasCompletas.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        
        // Exibir histórico
        const tbody = document.getElementById('tbodyHistorico');
        tbody.innerHTML = '';
        
        if (guiasCompletas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma guia encontrada</td></tr>';
            return;
        }
        
        guiasCompletas.forEach(guia => {
            const dataCriacao = new Date(guia.dataCriacao).toLocaleDateString('pt-BR');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${guia.colaborador.nome}</td>
                <td>${guia.colaborador.cpf}</td>
                <td>${guia.funcaoNome}</td>
                <td>${guia.tipoExameNome}</td>
                <td>${dataCriacao}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" data-id="${guia.id}" data-action="view-guia">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" data-id="${guia.id}" data-action="pdf-guia">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${guia.id}" data-action="delete-guia">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adicionar event listeners para ações
        document.querySelectorAll('[data-action="view-guia"]').forEach(btn => {
            btn.addEventListener('click', () => viewGuia(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('[data-action="pdf-guia"]').forEach(btn => {
            btn.addEventListener('click', () => generatePDF(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('[data-action="delete-guia"]').forEach(btn => {
            btn.addEventListener('click', () => deleteGuia(btn.getAttribute('data-id')));
        });
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showToast('Erro ao carregar histórico', 'danger');
    }
}

// Visualizar guia
async function viewGuia(id) {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Obter guia
        const guia = await db.guias.get(parseInt(id));
        
        // Obter dados adicionais
        const colaborador = await db.colaboradores.get(guia.colaboradorId);
        const funcao = await db.funcoes.get(guia.funcaoId);
        const tipoExame = await db.tiposExame.get(guia.tipoExameId);
        
        // Obter exames e riscos
        const result = await db.obterExamesPorFuncaoETipo(guia.funcaoId, guia.tipoExameId);
        
        // Preparar dados para a guia
        const colaboradorData = {
            ...colaborador,
            funcaoNome: funcao.nome,
            tipoExameNome: tipoExame.nome
        };
        
        // Obter dados da empresa
        const empresas = await db.empresas.toArray();
        const empresaData = empresas.length > 0 ? empresas[0] : {};
        
        // Mostrar pré-visualização
        pdfGenerator.previewGuia(colaboradorData, result.exames, result.riscos, empresaData);
        
        // Mostrar modal de pré-visualização
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
    } catch (error) {
        console.error('Erro ao visualizar guia:', error);
        showToast('Erro ao visualizar guia', 'danger');
    }
}

// Gerar PDF
async function generatePDF(id) {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        if (id) {
            // Obter guia
            const guia = await db.guias.get(parseInt(id));
            
            // Obter dados adicionais
            const colaborador = await db.colaboradores.get(guia.colaboradorId);
            const funcao = await db.funcoes.get(guia.funcaoId);
            const tipoExame = await db.tiposExame.get(guia.tipoExameId);
            
            // Obter exames e riscos
            const result = await db.obterExamesPorFuncaoETipo(guia.funcaoId, guia.tipoExameId);
            
            // Preparar dados para a guia
            const colaboradorData = {
                ...colaborador,
                funcaoNome: funcao.nome,
                tipoExameNome: tipoExame.nome
            };
            
            // Obter dados da empresa
            const empresas = await db.empresas.toArray();
            const empresaData = empresas.length > 0 ? empresas[0] : {};
            
            // Mostrar pré-visualização
            pdfGenerator.previewGuia(colaboradorData, result.exames, result.riscos, empresaData);
            
            // Gerar PDF
            setTimeout(() => {
                const guiaElement = document.getElementById('guia-preview');
                const filename = `guia_${colaborador.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                pdfGenerator.generatePDF(guiaElement, filename);
            }, 500);
        } else {
            // Gerar PDF da pré-visualização atual
            setTimeout(() => {
                const guiaElement = document.getElementById('guia-preview');
                const nome = document.getElementById('nome').value.trim();
                const filename = `guia_${nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                pdfGenerator.generatePDF(guiaElement, filename);
            }, 500);
        }
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF', 'danger');
    }
}

// Excluir guia
async function deleteGuia(id) {
    if (!confirm('Tem certeza que deseja excluir esta guia?')) {
        return;
    }
    
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Obter guia
        const guia = await db.guias.get(parseInt(id));
        
        // Excluir guia
        await db.guias.delete(parseInt(id));
        
        // Excluir colaborador
        await db.colaboradores.delete(guia.colaboradorId);
        
        showToast('Guia excluída com sucesso', 'success');
        
        // Recarregar histórico
        loadHistorico();
    } catch (error) {
        console.error('Erro ao excluir guia:', error);
        showToast('Erro ao excluir guia', 'danger');
    }
}

// Alternar painel de configuração
function toggleConfigPanel() {
    const configPanel = document.getElementById('config-panel');
    configPanel.classList.toggle('d-none');
}

// Salvar configurações
async function saveConfig(e) {
    e.preventDefault();
    
    // Obter dados do formulário
    const nome = document.getElementById('empresaNome').value.trim();
    const cnpj = document.getElementById('empresaCnpj').value.trim();
    const telefone = document.getElementById('empresaTelefone').value.trim();
    const email = document.getElementById('empresaEmail').value.trim();
    const endereco = document.getElementById('empresaEndereco').value.trim();
    const medicoNome = document.getElementById('medicoNome').value.trim();
    const medicoCrm = document.getElementById('medicoCrm').value.trim();
    
    // Validar campos obrigatórios
    if (!nome || !cnpj) {
        showToast('Nome e CNPJ da empresa são obrigatórios', 'warning');
        return;
    }
    
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Verificar se já existe uma empresa
        const empresas = await db.empresas.toArray();
        
        if (empresas.length > 0) {
            // Atualizar empresa existente
            await db.empresas.update(empresas[0].id, {
                nome,
                cnpj,
                telefone,
                email,
                endereco,
                medicoNome,
                medicoCrm
            });
        } else {
            // Adicionar nova empresa
            await db.empresas.add({
                nome,
                cnpj,
                telefone,
                email,
                endereco,
                medicoNome,
                medicoCrm
            });
        }
        
        showToast('Configurações salvas com sucesso', 'success');
        
        // Ocultar painel de configuração
        document.getElementById('config-panel').classList.add('d-none');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showToast('Erro ao salvar configurações', 'danger');
    }
}

// Mostrar toast
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Remover toast após ocultar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

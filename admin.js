// Implementação do sistema de administração
class AdminSystem {
    constructor() {
        this.modals = {
            funcao: new bootstrap.Modal(document.getElementById('modalFuncao'), { backdrop: 'static' }),
            tipoExame: new bootstrap.Modal(document.getElementById('modalTipoExame'), { backdrop: 'static' }),
            exame: new bootstrap.Modal(document.getElementById('modalExame'), { backdrop: 'static' }),
            risco: new bootstrap.Modal(document.getElementById('modalRisco'), { backdrop: 'static' }),
            usuario: new bootstrap.Modal(document.getElementById('modalUsuario'), { backdrop: 'static' })
        };
        
        this.currentEditId = null;
        this.initEventListeners();
    }
    
    // Inicializar listeners de eventos
    initEventListeners() {
        // Funções
        document.getElementById('btnNovaFuncao').addEventListener('click', () => this.showFuncaoModal());
        document.getElementById('formFuncao').addEventListener('submit', (e) => this.saveFuncao(e));
        
        // Tipos de Exame
        document.getElementById('btnNovoTipoExame').addEventListener('click', () => this.showTipoExameModal());
        document.getElementById('formTipoExame').addEventListener('submit', (e) => this.saveTipoExame(e));
        
        // Exames
        document.getElementById('btnNovoExame').addEventListener('click', () => this.showExameModal());
        document.getElementById('formExame').addEventListener('submit', (e) => this.saveExame(e));
        
        // Riscos
        document.getElementById('btnNovoRisco').addEventListener('click', () => this.showRiscoModal());
        document.getElementById('formRisco').addEventListener('submit', (e) => this.saveRisco(e));
        
        // Usuários
        document.getElementById('btnNovoUsuario').addEventListener('click', () => this.showUsuarioModal());
        document.getElementById('formUsuario').addEventListener('submit', (e) => this.saveUsuario(e));
        
        // Mapeamento
        document.getElementById('selectFuncaoMapeamento').addEventListener('change', () => this.updateTipoExameMapeamento());
        document.getElementById('selectTipoExameMapeamento').addEventListener('change', () => this.loadMapeamento());
        document.getElementById('btnSalvarMapeamento').addEventListener('click', () => this.saveMapeamento());
        
        // Abas de administração
        document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('href');
                if (target === '#tab-funcoes') this.loadFuncoes();
                if (target === '#tab-tipos-exame') this.loadTiposExame();
                if (target === '#tab-exames') this.loadExames();
                if (target === '#tab-riscos') this.loadRiscos();
                if (target === '#tab-mapeamento') this.loadFuncoesMapeamento();
                if (target === '#tab-usuarios') this.loadUsuarios();
            });
        });
    }
    
    // Carregar dados iniciais
    async loadInitialData() {
        await this.loadFuncoes();
    }
    
    // === FUNÇÕES ===
    
    // Carregar funções
    async loadFuncoes() {
        try {
            const funcoes = await db.funcoes.toArray();
            const tbody = document.getElementById('tbodyFuncoes');
            tbody.innerHTML = '';
            
            if (funcoes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma função cadastrada</td></tr>';
                return;
            }
            
            funcoes.forEach(funcao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${funcao.nome}</td>
                    <td>${funcao.descricao || '-'}</td>
                    <td>${funcao.ativa ? '<span class="badge bg-success">Ativa</span>' : '<span class="badge bg-secondary">Inativa</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-id="${funcao.id}" data-action="edit-funcao">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${funcao.id}" data-action="delete-funcao">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Adicionar event listeners para edição e exclusão
            document.querySelectorAll('[data-action="edit-funcao"]').forEach(btn => {
                btn.addEventListener('click', () => this.editFuncao(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('[data-action="delete-funcao"]').forEach(btn => {
                btn.addEventListener('click', () => this.deleteFuncao(btn.getAttribute('data-id')));
            });
        } catch (error) {
            console.error('Erro ao carregar funções:', error);
            showToast('Erro ao carregar funções', 'danger');
        }
    }
    
    // Mostrar modal de função
    showFuncaoModal(funcao = null) {
        const form = document.getElementById('formFuncao');
        form.reset();
        
        if (funcao) {
            this.currentEditId = funcao.id;
            document.getElementById('funcaoNome').value = funcao.nome;
            document.getElementById('funcaoDescricao').value = funcao.descricao || '';
            document.getElementById('funcaoAtiva').checked = funcao.ativa;
            document.getElementById('modalFuncaoLabel').textContent = 'Editar Função';
        } else {
            this.currentEditId = null;
            document.getElementById('modalFuncaoLabel').textContent = 'Nova Função';
        }
        
        this.modals.funcao.show();
    }
    
    // Salvar função
    async saveFuncao(e) {
        e.preventDefault();
        
        const nome = document.getElementById('funcaoNome').value.trim();
        const descricao = document.getElementById('funcaoDescricao').value.trim();
        const ativa = document.getElementById('funcaoAtiva').checked;
        
        if (!nome) {
            showToast('Nome da função é obrigatório', 'warning');
            return;
        }
        
        try {
            if (this.currentEditId) {
                // Atualizar função existente
                await db.funcoes.update(parseInt(this.currentEditId), {
                    nome,
                    descricao,
                    ativa
                });
                
                showToast('Função atualizada com sucesso', 'success');
            } else {
                // Adicionar nova função
                await db.funcoes.add({
                    nome,
                    descricao,
                    ativa
                });
                
                showToast('Função adicionada com sucesso', 'success');
            }
            
            this.modals.funcao.hide();
            await this.loadFuncoes();
            await this.loadFuncoesMapeamento();
        } catch (error) {
            console.error('Erro ao salvar função:', error);
            showToast('Erro ao salvar função', 'danger');
        }
    }
    
    // Editar função
    async editFuncao(id) {
        try {
            const funcao = await db.funcoes.get(parseInt(id));
            if (funcao) {
                this.showFuncaoModal(funcao);
            }
        } catch (error) {
            console.error('Erro ao editar função:', error);
            showToast('Erro ao editar função', 'danger');
        }
    }
    
    // Excluir função
    async deleteFuncao(id) {
        if (!confirm('Tem certeza que deseja excluir esta função?')) {
            return;
        }
        
        try {
            // Verificar se existem mapeamentos para esta função
            const mapeamentos = await db.mapeamentoFuncaoExames
                .where('funcaoId')
                .equals(parseInt(id))
                .count();
            
            if (mapeamentos > 0) {
                showToast('Não é possível excluir esta função pois existem mapeamentos associados a ela', 'warning');
                return;
            }
            
            await db.funcoes.delete(parseInt(id));
            showToast('Função excluída com sucesso', 'success');
            await this.loadFuncoes();
            await this.loadFuncoesMapeamento();
        } catch (error) {
            console.error('Erro ao excluir função:', error);
            showToast('Erro ao excluir função', 'danger');
        }
    }
    
    // === TIPOS DE EXAME ===
    
    // Carregar tipos de exame
    async loadTiposExame() {
        try {
            const tiposExame = await db.tiposExame.toArray();
            const tbody = document.getElementById('tbodyTiposExame');
            tbody.innerHTML = '';
            
            if (tiposExame.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum tipo de exame cadastrado</td></tr>';
                return;
            }
            
            tiposExame.forEach(tipo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${tipo.nome}</td>
                    <td>${tipo.descricao || '-'}</td>
                    <td>${tipo.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-id="${tipo.id}" data-action="edit-tipo-exame">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${tipo.id}" data-action="delete-tipo-exame">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Adicionar event listeners para edição e exclusão
            document.querySelectorAll('[data-action="edit-tipo-exame"]').forEach(btn => {
                btn.addEventListener('click', () => this.editTipoExame(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('[data-action="delete-tipo-exame"]').forEach(btn => {
                btn.addEventListener('click', () => this.deleteTipoExame(btn.getAttribute('data-id')));
            });
        } catch (error) {
            console.error('Erro ao carregar tipos de exame:', error);
            showToast('Erro ao carregar tipos de exame', 'danger');
        }
    }
    
    // Mostrar modal de tipo de exame
    showTipoExameModal(tipo = null) {
        const form = document.getElementById('formTipoExame');
        form.reset();
        
        if (tipo) {
            this.currentEditId = tipo.id;
            document.getElementById('tipoExameNome').value = tipo.nome;
            document.getElementById('tipoExameDescricao').value = tipo.descricao || '';
            document.getElementById('tipoExameAtivo').checked = tipo.ativo;
            document.getElementById('modalTipoExameLabel').textContent = 'Editar Tipo de Exame';
        } else {
            this.currentEditId = null;
            document.getElementById('modalTipoExameLabel').textContent = 'Novo Tipo de Exame';
        }
        
        this.modals.tipoExame.show();
    }
    
    // Salvar tipo de exame
    async saveTipoExame(e) {
        e.preventDefault();
        
        const nome = document.getElementById('tipoExameNome').value.trim();
        const descricao = document.getElementById('tipoExameDescricao').value.trim();
        const ativo = document.getElementById('tipoExameAtivo').checked;
        
        if (!nome) {
            showToast('Nome do tipo de exame é obrigatório', 'warning');
            return;
        }
        
        try {
            if (this.currentEditId) {
                // Atualizar tipo de exame existente
                await db.tiposExame.update(parseInt(this.currentEditId), {
                    nome,
                    descricao,
                    ativo
                });
                
                showToast('Tipo de exame atualizado com sucesso', 'success');
            } else {
                // Adicionar novo tipo de exame
                await db.tiposExame.add({
                    nome,
                    descricao,
                    ativo
                });
                
                showToast('Tipo de exame adicionado com sucesso', 'success');
            }
            
            this.modals.tipoExame.hide();
            await this.loadTiposExame();
            await this.updateTipoExameMapeamento();
        } catch (error) {
            console.error('Erro ao salvar tipo de exame:', error);
            showToast('Erro ao salvar tipo de exame', 'danger');
        }
    }
    
    // Editar tipo de exame
    async editTipoExame(id) {
        try {
            const tipo = await db.tiposExame.get(parseInt(id));
            if (tipo) {
                this.showTipoExameModal(tipo);
            }
        } catch (error) {
            console.error('Erro ao editar tipo de exame:', error);
            showToast('Erro ao editar tipo de exame', 'danger');
        }
    }
    
    // Excluir tipo de exame
    async deleteTipoExame(id) {
        if (!confirm('Tem certeza que deseja excluir este tipo de exame?')) {
            return;
        }
        
        try {
            // Verificar se existem mapeamentos para este tipo de exame
            const mapeamentos = await db.mapeamentoFuncaoExames
                .where('tipoExameId')
                .equals(parseInt(id))
                .count();
            
            if (mapeamentos > 0) {
                showToast('Não é possível excluir este tipo de exame pois existem mapeamentos associados a ele', 'warning');
                return;
            }
            
            await db.tiposExame.delete(parseInt(id));
            showToast('Tipo de exame excluído com sucesso', 'success');
            await this.loadTiposExame();
            await this.updateTipoExameMapeamento();
        } catch (error) {
            console.error('Erro ao excluir tipo de exame:', error);
            showToast('Erro ao excluir tipo de exame', 'danger');
        }
    }
    
    // === EXAMES ===
    
    // Carregar exames
    async loadExames() {
        try {
            const exames = await db.exames.toArray();
            const tbody = document.getElementById('tbodyExames');
            tbody.innerHTML = '';
            
            if (exames.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum exame cadastrado</td></tr>';
                return;
            }
            
            exames.forEach(exame => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${exame.nome}</td>
                    <td>${exame.recomendacao || '-'}</td>
                    <td>${exame.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-id="${exame.id}" data-action="edit-exame">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${exame.id}" data-action="delete-exame">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Adicionar event listeners para edição e exclusão
            document.querySelectorAll('[data-action="edit-exame"]').forEach(btn => {
                btn.addEventListener('click', () => this.editExame(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('[data-action="delete-exame"]').forEach(btn => {
                btn.addEventListener('click', () => this.deleteExame(btn.getAttribute('data-id')));
            });
        } catch (error) {
            console.error('Erro ao carregar exames:', error);
            showToast('Erro ao carregar exames', 'danger');
        }
    }
    
    // Mostrar modal de exame
    showExameModal(exame = null) {
        const form = document.getElementById('formExame');
        form.reset();
        
        if (exame) {
            this.currentEditId = exame.id;
            document.getElementById('exameNome').value = exame.nome;
            document.getElementById('exameRecomendacao').value = exame.recomendacao || '';
            document.getElementById('exameAtivo').checked = exame.ativo;
            document.getElementById('modalExameLabel').textContent = 'Editar Exame';
        } else {
            this.currentEditId = null;
            document.getElementById('modalExameLabel').textContent = 'Novo Exame';
        }
        
        this.modals.exame.show();
    }
    
    // Salvar exame
    async saveExame(e) {
        e.preventDefault();
        
        const nome = document.getElementById('exameNome').value.trim();
        const recomendacao = document.getElementById('exameRecomendacao').value.trim();
        const ativo = document.getElementById('exameAtivo').checked;
        
        if (!nome) {
            showToast('Nome do exame é obrigatório', 'warning');
            return;
        }
        
        try {
            if (this.currentEditId) {
                // Atualizar exame existente
                await db.exames.update(parseInt(this.currentEditId), {
                    nome,
                    recomendacao,
                    ativo
                });
                
                showToast('Exame atualizado com sucesso', 'success');
            } else {
                // Adicionar novo exame
                await db.exames.add({
                    nome,
                    recomendacao,
                    ativo
                });
                
                showToast('Exame adicionado com sucesso', 'success');
            }
            
            this.modals.exame.hide();
            await this.loadExames();
            await this.loadMapeamento();
        } catch (error) {
            console.error('Erro ao salvar exame:', error);
            showToast('Erro ao salvar exame', 'danger');
        }
    }
    
    // Editar exame
    async editExame(id) {
        try {
            const exame = await db.exames.get(parseInt(id));
            if (exame) {
                this.showExameModal(exame);
            }
        } catch (error) {
            console.error('Erro ao editar exame:', error);
            showToast('Erro ao editar exame', 'danger');
        }
    }
    
    // Excluir exame
    async deleteExame(id) {
        if (!confirm('Tem certeza que deseja excluir este exame?')) {
            return;
        }
        
        try {
            // Verificar se o exame está sendo usado em algum mapeamento
            const mapeamentos = await db.mapeamentoFuncaoExames.toArray();
            const exameEmUso = mapeamentos.some(m => {
                const examesIds = m.examesIds.split(';').map(id => parseInt(id));
                return examesIds.includes(parseInt(id));
            });
            
            if (exameEmUso) {
                showToast('Não é possível excluir este exame pois ele está sendo usado em mapeamentos', 'warning');
                return;
            }
            
            await db.exames.delete(parseInt(id));
            showToast('Exame excluído com sucesso', 'success');
            await this.loadExames();
            await this.loadMapeamento();
        } catch (error) {
            console.error('Erro ao excluir exame:', error);
            showToast('Erro ao excluir exame', 'danger');
        }
    }
    
    // === RISCOS ===
    
    // Carregar riscos
    async loadRiscos() {
        try {
            const riscos = await db.riscos.toArray();
            const tbody = document.getElementById('tbodyRiscos');
            tbody.innerHTML = '';
            
            if (riscos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum risco cadastrado</td></tr>';
                return;
            }
            
            // Tradução dos tipos de risco
            const tiposRiscoTraduzidos = {
                fisico: 'Físico',
                quimico: 'Químico',
                biologico: 'Biológico',
                ergonomico: 'Ergonômico',
                acidentes: 'Acidentes'
            };
            
            riscos.forEach(risco => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${tiposRiscoTraduzidos[risco.tipo] || risco.tipo}</td>
                    <td>${risco.descricao}</td>
                    <td>${risco.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-id="${risco.id}" data-action="edit-risco">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${risco.id}" data-action="delete-risco">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Adicionar event listeners para edição e exclusão
            document.querySelectorAll('[data-action="edit-risco"]').forEach(btn => {
                btn.addEventListener('click', () => this.editRisco(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('[data-action="delete-risco"]').forEach(btn => {
                btn.addEventListener('click', () => this.deleteRisco(btn.getAttribute('data-id')));
            });
        } catch (error) {
            console.error('Erro ao carregar riscos:', error);
            showToast('Erro ao carregar riscos', 'danger');
        }
    }
    
    // Mostrar modal de risco
    showRiscoModal(risco = null) {
        const form = document.getElementById('formRisco');
        form.reset();
        
        if (risco) {
            this.currentEditId = risco.id;
            document.getElementById('riscoTipo').value = risco.tipo;
            document.getElementById('riscoDescricao').value = risco.descricao;
            document.getElementById('riscoAtivo').checked = risco.ativo;
            document.getElementById('modalRiscoLabel').textContent = 'Editar Risco';
        } else {
            this.currentEditId = null;
            document.getElementById('modalRiscoLabel').textContent = 'Novo Risco';
        }
        
        this.modals.risco.show();
    }
    
    // Salvar risco
    async saveRisco(e) {
        e.preventDefault();
        
        const tipo = document.getElementById('riscoTipo').value;
        const descricao = document.getElementById('riscoDescricao').value.trim();
        const ativo = document.getElementById('riscoAtivo').checked;
        
        if (!tipo) {
            showToast('Tipo de risco é obrigatório', 'warning');
            return;
        }
        
        if (!descricao) {
            showToast('Descrição do risco é obrigatória', 'warning');
            return;
        }
        
        try {
            if (this.currentEditId) {
                // Atualizar risco existente
                await db.riscos.update(parseInt(this.currentEditId), {
                    tipo,
                    descricao,
                    ativo
                });
                
                showToast('Risco atualizado com sucesso', 'success');
            } else {
                // Adicionar novo risco
                await db.riscos.add({
                    tipo,
                    descricao,
                    ativo
                });
                
                showToast('Risco adicionado com sucesso', 'success');
            }
            
            this.modals.risco.hide();
            await this.loadRiscos();
            await this.loadMapeamento();
        } catch (error) {
            console.error('Erro ao salvar risco:', error);
            showToast('Erro ao salvar risco', 'danger');
        }
    }
    
    // Editar risco
    async editRisco(id) {
        try {
            const risco = await db.riscos.get(parseInt(id));
            if (risco) {
                this.showRiscoModal(risco);
            }
        } catch (error) {
            console.error('Erro ao editar risco:', error);
            showToast('Erro ao editar risco', 'danger');
        }
    }
    
    // Excluir risco
    async deleteRisco(id) {
        if (!confirm('Tem certeza que deseja excluir este risco?')) {
            return;
        }
        
        try {
            // Verificar se o risco está sendo usado em algum mapeamento
            const mapeamentos = await db.mapeamentoFuncaoExames.toArray();
            const riscoEmUso = mapeamentos.some(m => {
                const riscosIds = m.riscosIds.split(';').map(id => parseInt(id));
                return riscosIds.includes(parseInt(id));
            });
            
            if (riscoEmUso) {
                showToast('Não é possível excluir este risco pois ele está sendo usado em mapeamentos', 'warning');
                return;
            }
            
            await db.riscos.delete(parseInt(id));
            showToast('Risco excluído com sucesso', 'success');
            await this.loadRiscos();
            await this.loadMapeamento();
        } catch (error) {
            console.error('Erro ao excluir risco:', error);
            showToast('Erro ao excluir risco', 'danger');
        }
    }
    
    // === MAPEAMENTO ===
    
    // Carregar funções para mapeamento
    async loadFuncoesMapeamento() {
        try {
            const funcoes = await db.funcoes.where('ativa').equals(true).toArray();
            const select = document.getElementById('selectFuncaoMapeamento');
            select.innerHTML = '<option value="">Selecione uma função</option>';
            
            funcoes.forEach(funcao => {
                const option = document.createElement('option');
                option.value = funcao.id;
                option.textContent = funcao.nome;
                select.appendChild(option);
            });
            
            await this.updateTipoExameMapeamento();
        } catch (error) {
            console.error('Erro ao carregar funções para mapeamento:', error);
            showToast('Erro ao carregar funções para mapeamento', 'danger');
        }
    }
    
    // Atualizar tipos de exame para mapeamento
    async updateTipoExameMapeamento() {
        try {
            const tiposExame = await db.tiposExame.where('ativo').equals(true).toArray();
            const select = document.getElementById('selectTipoExameMapeamento');
            select.innerHTML = '<option value="">Selecione um tipo de exame</option>';
            
            tiposExame.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nome;
                select.appendChild(option);
            });
            
            await this.loadMapeamento();
        } catch (error) {
            console.error('Erro ao atualizar tipos de exame para mapeamento:', error);
            showToast('Erro ao atualizar tipos de exame para mapeamento', 'danger');
        }
    }
    
    // Carregar mapeamento
    async loadMapeamento() {
        try {
            const funcaoId = document.getElementById('selectFuncaoMapeamento').value;
            const tipoExameId = document.getElementById('selectTipoExameMapeamento').value;
            
            // Limpar checkboxes
            document.querySelectorAll('#checkboxesExames input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            document.querySelectorAll('#checkboxesRiscos input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            if (!funcaoId || !tipoExameId) {
                return;
            }
            
            // Carregar exames ativos
            const exames = await db.exames.where('ativo').equals(true).toArray();
            const checkboxesExames = document.getElementById('checkboxesExames');
            checkboxesExames.innerHTML = '';
            
            if (exames.length === 0) {
                checkboxesExames.innerHTML = '<p class="text-center">Nenhum exame ativo cadastrado</p>';
            } else {
                exames.forEach(exame => {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    div.innerHTML = `
                        <input class="form-check-input" type="checkbox" id="exame-${exame.id}" value="${exame.id}">
                        <label class="form-check-label" for="exame-${exame.id}">
                            ${exame.nome}
                            ${exame.recomendacao ? `<small class="text-muted d-block">${exame.recomendacao}</small>` : ''}
                        </label>
                    `;
                    checkboxesExames.appendChild(div);
                });
            }
            
            // Carregar riscos ativos
            const riscos = await db.riscos.where('ativo').equals(true).toArray();
            const checkboxesRiscos = document.getElementById('checkboxesRiscos');
            checkboxesRiscos.innerHTML = '';
            
            if (riscos.length === 0) {
                checkboxesRiscos.innerHTML = '<p class="text-center">Nenhum risco ativo cadastrado</p>';
            } else {
                // Agrupar riscos por tipo
                const riscosPorTipo = {};
                riscos.forEach(risco => {
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
                
                // Criar checkboxes agrupados por tipo
                for (const tipo in riscosPorTipo) {
                    const tipoDiv = document.createElement('div');
                    tipoDiv.className = 'mb-3';
                    tipoDiv.innerHTML = `<h6>${tiposRiscoTraduzidos[tipo] || tipo}</h6>`;
                    
                    riscosPorTipo[tipo].forEach(risco => {
                        const div = document.createElement('div');
                        div.className = 'form-check';
                        div.innerHTML = `
                            <input class="form-check-input" type="checkbox" id="risco-${risco.id}" value="${risco.id}">
                            <label class="form-check-label" for="risco-${risco.id}">
                                ${risco.descricao}
                            </label>
                        `;
                        tipoDiv.appendChild(div);
                    });
                    
                    checkboxesRiscos.appendChild(tipoDiv);
                }
            }
            
            // Buscar mapeamento existente
            const mapeamento = await db.mapeamentoFuncaoExames
                .where({
                    funcaoId: parseInt(funcaoId),
                    tipoExameId: parseInt(tipoExameId)
                })
                .first();
            
            if (mapeamento) {
                // Marcar exames selecionados
                const examesIds = mapeamento.examesIds.split(';').map(id => parseInt(id));
                examesIds.forEach(id => {
                    const checkbox = document.getElementById(`exame-${id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                
                // Marcar riscos selecionados
                const riscosIds = mapeamento.riscosIds.split(';').map(id => parseInt(id));
                riscosIds.forEach(id => {
                    const checkbox = document.getElementById(`risco-${id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar mapeamento:', error);
            showToast('Erro ao carregar mapeamento', 'danger');
        }
    }
    
    // Salvar mapeamento
    async saveMapeamento() {
        try {
            const funcaoId = document.getElementById('selectFuncaoMapeamento').value;
            const tipoExameId = document.getElementById('selectTipoExameMapeamento').value;
            
            if (!funcaoId) {
                showToast('Selecione uma função', 'warning');
                return;
            }
            
            if (!tipoExameId) {
                showToast('Selecione um tipo de exame', 'warning');
                return;
            }
            
            // Obter exames selecionados
            const examesIds = [];
            document.querySelectorAll('#checkboxesExames input[type="checkbox"]:checked').forEach(cb => {
                examesIds.push(cb.value);
            });
            
            // Obter riscos selecionados
            const riscosIds = [];
            document.querySelectorAll('#checkboxesRiscos input[type="checkbox"]:checked').forEach(cb => {
                riscosIds.push(cb.value);
            });
            
            // Verificar se pelo menos um exame foi selecionado
            if (examesIds.length === 0) {
                showToast('Selecione pelo menos um exame', 'warning');
                return;
            }
            
            // Verificar se pelo menos um risco foi selecionado
            if (riscosIds.length === 0) {
                showToast('Selecione pelo menos um risco', 'warning');
                return;
            }
            
            // Buscar mapeamento existente
            const mapeamento = await db.mapeamentoFuncaoExames
                .where({
                    funcaoId: parseInt(funcaoId),
                    tipoExameId: parseInt(tipoExameId)
                })
                .first();
            
            if (mapeamento) {
                // Atualizar mapeamento existente
                await db.mapeamentoFuncaoExames.update(mapeamento.id, {
                    examesIds: examesIds.join(';'),
                    riscosIds: riscosIds.join(';')
                });
                
                showToast('Mapeamento atualizado com sucesso', 'success');
            } else {
                // Adicionar novo mapeamento
                await db.mapeamentoFuncaoExames.add({
                    funcaoId: parseInt(funcaoId),
                    tipoExameId: parseInt(tipoExameId),
                    examesIds: examesIds.join(';'),
                    riscosIds: riscosIds.join(';')
                });
                
                showToast('Mapeamento adicionado com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao salvar mapeamento:', error);
            showToast('Erro ao salvar mapeamento', 'danger');
        }
    }
    
    // === USUÁRIOS ===
    
    // Carregar usuários
    async loadUsuarios() {
        try {
            const usuarios = await db.usuarios.toArray();
            const tbody = document.getElementById('tbodyUsuarios');
            tbody.innerHTML = '';
            
            if (usuarios.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum usuário cadastrado</td></tr>';
                return;
            }
            
            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario.nome}</td>
                    <td>${usuario.username}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.tipo === 'admin' ? '<span class="badge bg-success">Administrador</span>' : '<span class="badge bg-secondary">Usuário</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-id="${usuario.id}" data-action="edit-usuario">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${usuario.id}" data-action="delete-usuario" ${usuario.id === auth.getCurrentUser().id ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Adicionar event listeners para edição e exclusão
            document.querySelectorAll('[data-action="edit-usuario"]').forEach(btn => {
                btn.addEventListener('click', () => this.editUsuario(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('[data-action="delete-usuario"]').forEach(btn => {
                btn.addEventListener('click', () => this.deleteUsuario(btn.getAttribute('data-id')));
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            showToast('Erro ao carregar usuários', 'danger');
        }
    }
    
    // Mostrar modal de usuário
    showUsuarioModal(usuario = null) {
        const form = document.getElementById('formUsuario');
        form.reset();
        
        // Mostrar ou ocultar campo de senha
        const senhaGroup = document.getElementById('senhaGroup');
        
        if (usuario) {
            this.currentEditId = usuario.id;
            document.getElementById('usuarioNome').value = usuario.nome;
            document.getElementById('usuarioUsername').value = usuario.username;
            document.getElementById('usuarioEmail').value = usuario.email;
            document.getElementById('usuarioTipo').value = usuario.tipo;
            document.getElementById('modalUsuarioLabel').textContent = 'Editar Usuário';
            
            // Ocultar campo de senha na edição
            senhaGroup.style.display = 'none';
        } else {
            this.currentEditId = null;
            document.getElementById('modalUsuarioLabel').textContent = 'Novo Usuário';
            
            // Mostrar campo de senha na criação
            senhaGroup.style.display = 'block';
        }
        
        this.modals.usuario.show();
    }
    
    // Salvar usuário
    async saveUsuario(e) {
        e.preventDefault();
        
        const nome = document.getElementById('usuarioNome').value.trim();
        const username = document.getElementById('usuarioUsername').value.trim();
        const email = document.getElementById('usuarioEmail').value.trim();
        const tipo = document.getElementById('usuarioTipo').value;
        
        if (!nome || !username || !email || !tipo) {
            showToast('Todos os campos são obrigatórios', 'warning');
            return;
        }
        
        try {
            if (this.currentEditId) {
                // Atualizar usuário existente
                await db.usuarios.update(parseInt(this.currentEditId), {
                    nome,
                    username,
                    email,
                    tipo
                });
                
                showToast('Usuário atualizado com sucesso', 'success');
            } else {
                // Verificar se o nome de usuário já existe
                const usuarioExistente = await db.usuarios
                    .where('username')
                    .equals(username)
                    .first();
                
                if (usuarioExistente) {
                    showToast('Nome de usuário já existe', 'warning');
                    return;
                }
                
                const senha = document.getElementById('usuarioSenha').value;
                
                if (!senha) {
                    showToast('Senha é obrigatória', 'warning');
                    return;
                }
                
                // Adicionar novo usuário
                await db.usuarios.add({
                    nome,
                    username,
                    password: senha, // Em produção, usar hash
                    email,
                    tipo,
                    ultimoAcesso: null
                });
                
                showToast('Usuário adicionado com sucesso', 'success');
            }
            
            this.modals.usuario.hide();
            await this.loadUsuarios();
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            showToast('Erro ao salvar usuário', 'danger');
        }
    }
    
    // Editar usuário
    async editUsuario(id) {
        try {
            const usuario = await db.usuarios.get(parseInt(id));
            if (usuario) {
                this.showUsuarioModal(usuario);
            }
        } catch (error) {
            console.error('Erro ao editar usuário:', error);
            showToast('Erro ao editar usuário', 'danger');
        }
    }
    
    // Excluir usuário
    async deleteUsuario(id) {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) {
            return;
        }
        
        try {
            // Verificar se é o usuário atual
            if (parseInt(id) === auth.getCurrentUser().id) {
                showToast('Não é possível excluir o usuário atual', 'warning');
                return;
            }
            
            await db.usuarios.delete(parseInt(id));
            showToast('Usuário excluído com sucesso', 'success');
            await this.loadUsuarios();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            showToast('Erro ao excluir usuário', 'danger');
        }
    }
}

// Criar instância global do sistema de administração
const adminSystem = new AdminSystem();

// Exportar a instância
window.adminSystem = adminSystem;

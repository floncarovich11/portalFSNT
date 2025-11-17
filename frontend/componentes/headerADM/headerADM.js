class Header extends HTMLElement {
    constructor() {
        super();
    }
    async connectedCallback() {
        const publicPages = ['/login', '/cadastro', '/alterarsenha'];
        const currentPath = window.location.pathname;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "/frontend/componentes/headerADM/headerADM.css";
        document.head.appendChild(style);
        if (publicPages.includes(currentPath)) {
            this.innerHTML = `
                <header>
                    <div class="containers">
                        <div class="logo">
                            <a href="../inicio">
                                <i class="fas fa-futbol"></i>
                            </a>
                        </div>
                    </div>
                </header>
            `;

            const ajustarEspacoAbaixoNavbar = () => {
                const header = this.querySelector("header");
                const mainContent = document.querySelector("main");
                if (header && mainContent) {
                    const headerHeight = header.offsetHeight;
                    mainContent.style.marginTop = `${headerHeight}px`;
                }
            };
            ajustarEspacoAbaixoNavbar();
            window.addEventListener("resize", ajustarEspacoAbaixoNavbar);
            return;
        }
        function decodificarToken(token) {
            try {
                const payloadBase64 = token.split('.')[1];
                const payload = JSON.parse(atob(payloadBase64));
                return payload;
            } catch (error) {
                console.error("Erro ao decodificar token:", error);
                return null;
            }
        }

        function obterDadosDoToken() {
            const token = localStorage.getItem("token");
            if (!token) return null;

            const dados = decodificarToken(token);
            if (!dados || !dados.id_usuario || (dados.exp && dados.exp < Math.floor(Date.now() / 1000))) {
                return null;
            }

            return dados;
        }

        const dadosToken = obterDadosDoToken();
        const idUsuario = dadosToken?.id_usuario;
        this.innerHTML = `
            <header>
                <div class="header-top">
                    <div class="nada"></div>
                    <div class="logo">
                        <a href="../abrirTicket/abrirTicket.html">
                            <img src="/frontend/assets/img/logoFSNT.png" alt="Logo FSNT" />
                        </a>
                    </div>
                    <div class="icones">
                        <a href="../ajuda/ajuda.html" class="icon-link">
                            <img src="/frontend/assets/img/ajuda.png" alt="Ajuda" />
                        </a>
                        <a href="../perfil/perfil.html" class="icon-link">
                            <img src="/frontend/assets/img/user.png" alt="Perfil" />
                        </a>
                    </div>
                </div>
                <div class='paginas'>
                    <nav class="nav-menu">
                        <div class="nav-item">
                            <a href="../dashboardADM/dashboardADM.html" data-page="abrir-ticket">Dashboard</a>
                        </div>
                        <div class="nav-item">
                            <a href="../ticketsADM/ticketsADM.html" data-page="meus-tickets">Tickets</a>
                        </div>
                        <div class="nav-item">
                            <a href="../ajuda/ajuda.html" data-page="ajuda">Acessos</a>
                        </div>
                        <div class="nav-item">
                            <a href="../ajuda/ajuda.html" data-page="ajuda">Configurações</a>
                        </div>
                    </nav>
                </div>
            </header>
        `;

        // Marcar aba ativa
        const navLinks = this.querySelectorAll("nav a[data-page]");
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (currentPath.includes(page)) {
                link.classList.add('active');
            }
        });

        const authDesktop = this.querySelector("#auth-desktop");
        const authMobile = this.querySelector("#auth-mobile");
        const saudacaoMobile = this.querySelector("#saudacao-mobile");
        if (idUsuario) {
            try {
                const response = await fetch(`/usuarios/${idUsuario}`);
                const data = await response.json();
                const nomeUsuario = data.nome?.split(" ")[0] || "Usuário";
                const saudacao = `<span class="bem-vindo">Olá, ${nomeUsuario}</span>`;

                const dashboardIcon = (data.tipo_usuario === 'Dono' || data.tipo_usuario === 'Administrador') ? `
                    <a href="/dashboard" class="icon-link">
                        <i class="fas fa-chart-bar"></i>
                    </a>
                ` : '';
                authDesktop.innerHTML = saudacao + dashboardIcon + `<a id="logout-desktop" class="login">Sair</a>`;
                saudacaoMobile.innerHTML = saudacao;
                authMobile.innerHTML = dashboardIcon + `<a id="logout-mobile" class="login">Sair</a>`;
                this.querySelector("#logout-desktop").addEventListener("click", () => {
                    localStorage.clear();
                    window.location.href = "/login";
                });
                this.querySelector("#logout-mobile").addEventListener("click", () => {
                    localStorage.clear();
                    window.location.href = "/login";
                });
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
            }
        } else {
        }
        const menuToggle = this.querySelector(".menu-toggle");
        const navMenu = this.querySelector(".nav-menu");
        const navLinksAll = this.querySelectorAll("nav a");
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
        navLinksAll.forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
            });
        });
        const ajustarEspacoAbaixoNavbar = () => {
            const header = this.querySelector("header");
            const mainContent = document.querySelector("main");
            if (!mainContent) return;
            if (header) {
                const headerHeight = header.offsetHeight;
                mainContent.style.marginTop = `${headerHeight}px`;
            }
        };
        window.requestAnimationFrame(() => {
            ajustarEspacoAbaixoNavbar();
        });
        window.addEventListener("resize", ajustarEspacoAbaixoNavbar);
    }
}
customElements.define("header-adm", Header);
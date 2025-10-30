class Header extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const publicPages = ['/login', '/cadastro', '/alterarsenha'];
        const currentPath = window.location.pathname;

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "/frontend/componentes/headerLogin/headerLogin.css";
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
                <div class="containers">
                    <div class="logo">
                        <a href="../inicio">
                            <img src="/frontend/assets/img/logoFSNT.png" alt="Logo FSNT" />
                        </a>
                    </div>
                </div>
            </header>
        `;

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
                    <a href="/dashboard">
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
                authDesktop.innerHTML = `<a href="/login" id="login">Entrar</a>`;
                authMobile.innerHTML = `<a href="/login" id="login">Entrar</a>`;
            }
        } else {
            authDesktop.innerHTML = `<a href="/login" id="login">Entrar</a>`;
            authMobile.innerHTML = `<a href="/login" id="login">Entrar</a>`;
        }

        const menuToggle = this.querySelector(".menu-toggle");
        const navMenu = this.querySelector(".nav-menu");
        const navLinks = this.querySelectorAll("nav a");

        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });

        navLinks.forEach(link => {
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

customElements.define("header-login", Header);
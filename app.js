document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // --- CONFIGURATION ---
        config: {
            ARTICLES_PER_PAGE: 6,
            ASSET_BASE: "assets",
            get PDF_DIR() { return `${this.ASSET_BASE}/pdfs`; },
            get IMG_DIR() { return `${this.ASSET_BASE}/images`; },
            companyCurationMapping: [
                 { 
                    keywords: ['visa', 'mastercard', 'amex', 'american express', 'discover'], 
                    articleIds: [
                        'visa-mastercard-dispute-explainer-nov-2019',
                        'visa-combatting-fraud-news-jun-2019',
                        'credit-book-report-mercator-research-mar-2021',
                        'big-tech-is-coming-dec-2019',
                        'connected-intelligence-fighting-fraud-july-2019',
                        'api-banking-overview-aug-2019'
                    ] 
                },
                { 
                    keywords: ['fintech', 'startup', 'stripe', 'paypal', 'block', 'square'], 
                    articleIds: [
                        'fintech-bubble-profitability-mar-2023',
                        'fintech-bank-collaboration-jun-2023',
                        'fintech-lending-access-may-2023',
                        'nonfinancial-brands-embedded-finance-april-2023',
                        'baas-fis-win-customers-march-2023',
                        'big-tech-is-coming-dec-2019'
                    ]
                },
                { keywords: ['fraud', 'security', 'forter', 'nudata'], articleIds: ['smb-fraud-threats-remote-work-mar-2023', 'cyber-attack-architecture-nudata-jan-2020', 'understanding-synthetic-identity-fraud-aug-2019', 'connected-intelligence-fighting-fraud-july-2019', 'visa-combatting-fraud-news-jun-2019', 'stopping-bank-fraud-cybersecurity-june-2023'] }
            ]
        },

        // --- STATE ---
        state: {
            activeTopicFilters: [],
            activeGenreFilter: 'All',
            tempTopicFilters: [],
            tempGenreFilter: 'All',
            currentArticles: [],
            articlesToShow: 0,
            curatedArticleIds: [],
            cardObserver: null,
        },

        // --- DOM ELEMENTS ---
        dom: {},

        // --- INITIALIZATION ---
        init() {
            this.state.articlesToShow = this.config.ARTICLES_PER_PAGE;
            this.cacheDom();
            this.initStateFromURL();
            this.initCardObserver();
            this.bindEvents();
            this.renderFilterButtons();
            this.applyFiltersAndRender();
        },

        cacheDom() {
            this.dom.portfolioGrid = document.getElementById('portfolio-grid');
            this.dom.tagFiltersContainer = document.getElementById('tag-filters');
            this.dom.genreFiltersContainer = document.getElementById('genre-filters');
            this.dom.clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
            this.dom.clearTopicFilterBtn = document.getElementById('clear-topic-filter');
            this.dom.clearGenreFilterBtn = document.getElementById('clear-genre-filter');
            this.dom.portfolioHeading = document.getElementById('portfolio-heading');
            this.dom.noResultsMessage = document.getElementById('no-results');
            this.dom.seeMoreBtn = document.getElementById('see-more-btn');
            this.dom.seeLessBtn = document.getElementById('see-less-btn');
            this.dom.paginationControls = document.getElementById('pagination-controls');
            this.dom.activeFiltersContainer = document.getElementById('active-filters-container');
            this.dom.clearActiveFiltersBtn = document.getElementById('clear-active-filters-btn');
            this.dom.applyBtnContainer = document.getElementById('apply-btn-container');
            this.dom.applyFiltersBtn = document.getElementById('apply-filters-btn');
            this.dom.filterToggleBtn = document.getElementById('filter-toggle-btn');
            this.dom.filterPanel = document.getElementById('filter-panel');
            this.dom.filterChevron = document.getElementById('filter-chevron');
            this.dom.closeFilterBtn = document.getElementById('close-filter-btn');
            this.dom.filterOverlay = document.getElementById('filter-overlay');
            this.dom.researchWarning = document.getElementById('research-warning');
        },

        initStateFromURL() {
            const params = new URLSearchParams(window.location.search);
            const topics = params.get('topics');
            const genre = params.get('genre');
            const companyName = params.get('curate');

            if (companyName) {
                this.curateArticlesByCompany(companyName);
            }

            if (topics) {
                this.state.activeTopicFilters = topics.split(',');
            }
            if (genre) {
                this.state.activeGenreFilter = genre;
            }
            
            this.state.tempTopicFilters = [...this.state.activeTopicFilters];
            this.state.tempGenreFilter = this.state.activeGenreFilter;
        },

        // --- RENDERING ---
        createArticleCard(article) {
            const card = document.createElement('div');
            card.className = 'article-card bg-gray-50 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-500 ease-out flex flex-col opacity-0 translate-y-5';

            const imageUrl = article.imageUrl || `${this.config.IMG_DIR}/${article.id}.png`;
            const articleUrl = article.article_url || `${this.config.PDF_DIR}/${article.id}.pdf`;
            
            // Image
            const cardImage = () => {
                const img = document.createElement('img');
                img.className = 'card-image w-full';
                img.src = imageUrl;
                img.alt = `Abstract image representing ${article.title}`;
                img.onerror = function() {
                    this.onerror=null;
                    this.src='https://placehold.co/600x400/cccccc/FFFFFF?text=Image+Not+Found';
                };
                card.appendChild(img);
            };

            // Content
            const cardContent = () => {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'p-6 flex-grow flex flex-col';

                const textContentDiv = document.createElement('div');
                textContentDiv.className = 'flex-grow';

                textContentDiv.innerHTML = `
                    <p class="text-sm text-gray-500 mb-1">${article.publication} • ${new Date(article.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                    <h3 class="text-2xl font-bold text-gray-800 mb-3">${article.title}</h3>
                    <p class="text-gray-600 leading-relaxed mb-4">${article.summary}</p>
                `;

                contentDiv.appendChild(textContentDiv);

                // Button
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'pt-4 mt-auto bg-gray-50';
                const readMoreBtn = document.createElement('button');
                readMoreBtn.className = 'read-more-btn';
                readMoreBtn.textContent = 'Read More →';
                readMoreBtn.addEventListener('click', () => this.openPdfModal(articleUrl, article.title));
                buttonContainer.appendChild(readMoreBtn);

                contentDiv.appendChild(buttonContainer);
                card.appendChild(contentDiv);
            };

            cardImage();
            cardContent();
            return card;
        },

        renderArticles() {
            const { currentArticles, articlesToShow } = this.state;
            const { portfolioGrid, noResultsMessage, paginationControls, seeMoreBtn, seeLessBtn } = this.dom;

            portfolioGrid.innerHTML = '';

            if (currentArticles.length === 0) {
                noResultsMessage.classList.remove('hidden');
                portfolioGrid.classList.add('hidden');
                paginationControls.classList.add('hidden');
                return;
            }

            noResultsMessage.classList.add('hidden');
            portfolioGrid.classList.remove('hidden');

            const articlesToDisplay = currentArticles.slice(0, articlesToShow);
            const fragment = document.createDocumentFragment();
            articlesToDisplay.forEach(article => {
                fragment.appendChild(this.createArticleCard(article));
            });
            portfolioGrid.appendChild(fragment);

            // Observe cards for scroll animations
            if (this.state.cardObserver) {
                portfolioGrid.querySelectorAll('.article-card').forEach(card => this.state.cardObserver.observe(card));
            }

            // Handle pagination controls visibility
            if (currentArticles.length <= this.config.ARTICLES_PER_PAGE) {
                paginationControls.classList.add('hidden');
            } else {
                paginationControls.classList.remove('hidden');
                seeMoreBtn.classList.toggle('hidden', articlesToShow >= currentArticles.length);
                seeLessBtn.classList.toggle('hidden', articlesToShow <= this.config.ARTICLES_PER_PAGE);
            }
        },

        renderFilterButtons() {
            const allTags = [...new Set(articles.flatMap(a => a.tags))].sort();
            const allGenres = [...new Set(articles.map(a => a.genre))].sort();

            const createButtons = (items) => items.map(item => `
                <button data-filter="${item}" class="tag bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-full shadow-sm hover:bg-gray-100">
                    ${item}
                </button>
            `).join('');

            this.dom.tagFiltersContainer.innerHTML = createButtons(allTags);
            this.dom.genreFiltersContainer.innerHTML = createButtons(allGenres);
        },

        applyFiltersAndRender(withTransition = false) {
            const performUpdate = () => {
                let filteredArticles = [...articles];
                const { activeTopicFilters, activeGenreFilter, curatedArticleIds } = this.state;
                const isDefaultView = activeTopicFilters.length === 0 && activeGenreFilter === 'All';

                // Apply Topic filters (multi-select)
                if (activeTopicFilters.length > 0) {
                    filteredArticles = filteredArticles.filter(article => activeTopicFilters.every(filter => article.tags.includes(filter)));
                }

                // Apply Genre filter (single-select)
                if (activeGenreFilter !== 'All') {
                    filteredArticles = filteredArticles.filter(a => a.genre === activeGenreFilter);
                }

                // Sorting logic
                if (isDefaultView) {
                    if (curatedArticleIds.length > 0) {
                        filteredArticles.sort((a, b) => {
                            const isACurated = curatedArticleIds.includes(a.id);
                            const isBCurated = curatedArticleIds.includes(b.id);

                            if (isACurated && !isBCurated) return -1; // a comes first
                            if (!isACurated && isBCurated) return 1;  // b comes first

                            return new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00');
                        });
                    } else {
                        filteredArticles.sort((a, b) => {
                            const featuredSort = (b.featured === true) - (a.featured === true);
                            if (featuredSort !== 0) return featuredSort;
                            return new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00');
                        });
                        this.dom.portfolioHeading.textContent = "Featured Work";
                    }
                } else {
                    filteredArticles.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
                    this.dom.portfolioHeading.textContent = "Filtered Results";
                }

                this.state.currentArticles = filteredArticles;
                this.state.articlesToShow = this.config.ARTICLES_PER_PAGE;
                
                this.renderArticles();
                this.updateURLWithFilters();
                this.updateActiveButtons();
                this.toggleClearActiveFiltersButton();

                this.dom.researchWarning.classList.toggle('hidden', this.state.activeGenreFilter !== 'Research');

                if (withTransition) {
                    this.dom.portfolioGrid.style.opacity = 1;
                }
            };

            if (withTransition) {
                this.dom.portfolioGrid.style.opacity = 0;
                setTimeout(performUpdate, 200);
            } else {
                performUpdate();
            }
        },

        // --- CURATION ---
        getCuratedIdsForCompany(companyName) {
            if (!companyName) return [];
            const lowerCaseName = companyName.toLowerCase();
            for (const mapping of this.config.companyCurationMapping) {
                if (mapping.keywords.some(keyword => lowerCaseName.includes(keyword))) {
                    return mapping.articleIds;
                }
            }
            return [];
        },

        curateArticlesByCompany(companyName) {
            this.state.curatedArticleIds = this.getCuratedIdsForCompany(companyName);
            if (this.state.curatedArticleIds.length > 0) {
                const displayCompany = companyName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.dom.portfolioHeading.textContent = `Work Curated for ${displayCompany}`;
            }
        },

        // --- UI & STATE UPDATES ---
        handleSeeMore() {
            this.state.articlesToShow += this.config.ARTICLES_PER_PAGE;
            this.renderArticles();
        },

        handleSeeLess() {
            this.state.articlesToShow = this.config.ARTICLES_PER_PAGE;
            this.renderArticles();
            window.scrollTo({ top: this.dom.portfolioGrid.offsetTop - 100, behavior: 'smooth' });
        },

        updateActiveButtons() {
            const { tempTopicFilters, tempGenreFilter } = this.state;
            const { tagFiltersContainer, genreFiltersContainer } = this.dom;

            const topicButtons = tagFiltersContainer.querySelectorAll('button');
            topicButtons.forEach(button => {
                button.classList.toggle('active-tag', tempTopicFilters.includes(button.dataset.filter));
            });

            const genreButtons = genreFiltersContainer.querySelectorAll('button');
            genreButtons.forEach(button => {
                button.classList.toggle('active-tag', button.dataset.filter === tempGenreFilter);
            });
        },

        toggleClearActiveFiltersButton() {
            const { activeTopicFilters, activeGenreFilter } = this.state;
            const areFiltersActive = activeTopicFilters.length > 0 || activeGenreFilter !== 'All';
            this.dom.activeFiltersContainer.classList.toggle('hidden', !areFiltersActive);
        },

        updateURLWithFilters() {
            const { activeTopicFilters, activeGenreFilter } = this.state;
            const params = new URLSearchParams();

            if (activeTopicFilters.length > 0) {
                params.set('topics', activeTopicFilters.join(','));
            }
            if (activeGenreFilter !== 'All') {
                params.set('genre', activeGenreFilter);
            }

            const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            history.pushState({path: newUrl}, '', newUrl);
        },

        // --- MODAL CONTROL ---
        openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-95');
            document.body.classList.add('overflow-hidden');
        },

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.add('opacity-0');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('pointer-events-none'), 250);
            document.body.classList.remove('overflow-hidden');

            if (modalId === 'pdf-modal') {
                document.getElementById('pdf-viewer').src = '';
            }
        },

        openPdfModal(pdfUrl, title) {
            const pdfViewer = document.getElementById('pdf-viewer');
            const pdfTitle = document.getElementById('pdf-title');
            
            pdfTitle.textContent = title;
            pdfViewer.src = pdfUrl;
            
            this.openModal('pdf-modal');
        },

        // --- EVENT BINDING & OBSERVERS ---
        initCardObserver() {
            this.state.cardObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('opacity-0', 'translate-y-5');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '0px 0px -100px 0px'
            });
        },

        bindEvents() {
            // Filter Panel
            const openFilterPanel = () => {
                this.state.tempTopicFilters = [...this.state.activeTopicFilters];
                this.state.tempGenreFilter = this.state.activeGenreFilter;
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.add('hidden');

                this.dom.filterPanel.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                this.dom.filterPanel.classList.add('is-open');
                this.dom.filterOverlay.classList.remove('opacity-0', 'pointer-events-none');
                this.dom.filterChevron.classList.add('rotate-180');
                this.dom.filterToggleBtn.setAttribute('aria-expanded', 'true');
                document.body.classList.add('overflow-hidden');

                setTimeout(() => {
                    const filterPanelTop = this.dom.filterPanel.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: filterPanelTop - 20, behavior: 'smooth' });
                }, 100);
            };

            const closeFilterPanel = () => {
                this.dom.filterPanel.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                this.dom.filterPanel.classList.remove('is-open');
                this.dom.filterOverlay.classList.add('opacity-0', 'pointer-events-none');
                this.dom.filterChevron.classList.remove('rotate-180');
                this.dom.filterToggleBtn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('overflow-hidden');
                this.toggleClearActiveFiltersButton();
            };

            this.dom.filterToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = this.dom.filterToggleBtn.getAttribute('aria-expanded') === 'true';
                isExpanded ? closeFilterPanel() : openFilterPanel();
            });

            this.dom.closeFilterBtn.addEventListener('click', () => {
                closeFilterPanel();
            });

            document.addEventListener('click', (e) => {
                const isExpanded = this.dom.filterToggleBtn.getAttribute('aria-expanded') === 'true';
                if (isExpanded && !this.dom.filterPanel.contains(e.target) && !this.dom.filterToggleBtn.contains(e.target)) {
                    closeFilterPanel();
                }
            });

            // Filter buttons
            this.dom.tagFiltersContainer.addEventListener('click', e => {
                if (e.target.tagName !== 'BUTTON') return;
                const clickedFilter = e.target.dataset.filter;
                const filterIndex = this.state.tempTopicFilters.indexOf(clickedFilter);

                if (filterIndex > -1) {
                    this.state.tempTopicFilters.splice(filterIndex, 1);
                } else {
                    this.state.tempTopicFilters.push(clickedFilter);
                }
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.remove('hidden');
            });

            this.dom.genreFiltersContainer.addEventListener('click', e => {
                if (e.target.tagName !== 'BUTTON') return;
                this.state.tempGenreFilter = this.state.tempGenreFilter === e.target.dataset.filter ? 'All' : e.target.dataset.filter;
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.remove('hidden');
            });
            
            this.dom.applyFiltersBtn.addEventListener('click', () => {
                this.state.activeTopicFilters = [...this.state.tempTopicFilters];
                this.state.activeGenreFilter = this.state.tempGenreFilter;
                this.applyFiltersAndRender(true);
                this.dom.applyBtnContainer.classList.add('hidden');
                closeFilterPanel();
            });

            this.dom.clearTopicFilterBtn.addEventListener('click', () => {
                this.state.tempTopicFilters = [];
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.remove('hidden');
            });

            this.dom.clearGenreFilterBtn.addEventListener('click', () => {
                this.state.tempGenreFilter = 'All';
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.remove('hidden');
            });

            this.dom.clearAllFiltersBtn.addEventListener('click', () => {
                this.state.tempTopicFilters = [];
                this.state.tempGenreFilter = 'All';
                this.updateActiveButtons();
                this.dom.applyBtnContainer.classList.remove('hidden');
            });

            this.dom.clearActiveFiltersBtn.addEventListener('click', () => {
                this.state.activeTopicFilters = [];
                this.state.activeGenreFilter = 'All';
                this.state.tempTopicFilters = [];
                this.state.tempGenreFilter = 'All';
                this.applyFiltersAndRender(true);
                this.updateActiveButtons();
            });

            // Pagination
            this.dom.seeMoreBtn.addEventListener('click', () => this.handleSeeMore());
            this.dom.seeLessBtn.addEventListener('click', () => this.handleSeeLess());

            // Sticky filter bar
            const stickyFilterBar = document.querySelector('.sticky'); // This is fine as a one-off
            const observer = new IntersectionObserver(
                ([e]) => stickyFilterBar.classList.toggle('is-sticky', e.intersectionRatio < 1),
                { threshold: [1], rootMargin: "-1px 0px 0px 0px" }
            );
            observer.observe(stickyFilterBar);

            // Contact button
            const contactBtn = document.getElementById('contact-btn');
            const emailInfo = document.getElementById('email-info');
            const contactContainer = document.getElementById('contact-container');
            contactBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                emailInfo.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!contactContainer.contains(e.target)) {
                    emailInfo.classList.add('hidden');
                }
            });

            // Copy email
            const copyEmailBtn = document.getElementById('copy-email-btn');
            const emailAddress = document.getElementById('email-address').textContent;
            const copyTooltip = document.getElementById('copy-tooltip');
            copyEmailBtn.addEventListener('mouseenter', () => {
                if (copyTooltip.textContent !== 'Copied!') {
                    copyTooltip.textContent = 'Copy to clipboard';
                }
                copyTooltip.classList.remove('opacity-0');
            });
            copyEmailBtn.addEventListener('mouseleave', () => {
                copyTooltip.classList.add('opacity-0');
            });
            copyEmailBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(emailAddress).then(() => {
                    copyTooltip.textContent = 'Copied!';
                    setTimeout(() => { copyTooltip.textContent = 'Copy to clipboard'; }, 2000);
                });
            });

            // Back to top
            const backToTopBtn = document.getElementById('back-to-top-btn');
            window.addEventListener('scroll', () => {
                backToTopBtn.classList.toggle('opacity-0', window.scrollY <= 400);
                backToTopBtn.classList.toggle('pointer-events-none', window.scrollY <= 400);
            });
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            // Global keydown and modal clicks
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal('colophon-modal');
                    this.closeModal('pdf-modal');
                }
            });
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeModal(modal.id);
                });
            });

            // Static modal buttons
            document.getElementById('open-colophon-btn').addEventListener('click', () => this.openModal('colophon-modal'));
            document.getElementById('close-colophon-btn').addEventListener('click', () => this.closeModal('colophon-modal'));
            document.getElementById('close-pdf-btn').addEventListener('click', () => this.closeModal('pdf-modal'));

            // Copyright year
            document.getElementById('copyright-year').textContent = new Date().getFullYear();
        }
    };

    App.init();
});

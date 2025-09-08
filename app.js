// --- DATA: The heart of the portfolio ---

        const ASSET_BASE = "assets";
        const PDF_DIR = `${ASSET_BASE}/pdfs`;
        const IMG_DIR = `${ASSET_BASE}/images`;

        // --- APPLICATION LOGIC ---
        
        // DOM Elements
        const portfolioGrid = document.getElementById('portfolio-grid');
        const tagFiltersContainer = document.getElementById('tag-filters');
        const genreFiltersContainer = document.getElementById('genre-filters');
        const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
        const clearTopicFilterBtn = document.getElementById('clear-topic-filter');
        const clearGenreFilterBtn = document.getElementById('clear-genre-filter');
        const portfolioHeading = document.getElementById('portfolio-heading');
        const noResultsMessage = document.getElementById('no-results');
        const seeMoreBtn = document.getElementById('see-more-btn');
        const seeLessBtn = document.getElementById('see-less-btn');
        const paginationControls = document.getElementById('pagination-controls');
        const activeFiltersContainer = document.getElementById('active-filters-container');
        const clearActiveFiltersBtn = document.getElementById('clear-active-filters-btn');
        const applyBtnContainer = document.getElementById('apply-btn-container');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');

        // State
        const ARTICLES_PER_PAGE = 6;
        let activeTopicFilters = [];
        let activeGenreFilter = 'All';
        let tempTopicFilters = [];
        let tempGenreFilter = 'All';
        let currentArticles = [];
        let articlesToShow = ARTICLES_PER_PAGE;
        let cardObserver;

        // Function to render article cards to the DOM
        function renderArticles() {
            const articlesToDisplay = currentArticles.slice(0, articlesToShow);
            
            portfolioGrid.innerHTML = ''; // Clear existing grid
            
            if (currentArticles.length === 0) {
                noResultsMessage.classList.remove('hidden');
                portfolioGrid.classList.add('hidden');
                paginationControls.classList.add('hidden');
                return;
            } 
            
            noResultsMessage.classList.add('hidden');
            portfolioGrid.classList.remove('hidden');
            
            articlesToDisplay.forEach(article => {
                const card = document.createElement('div');

                // --- EDIT: Logic to dynamically build asset URLs from the ID.
                // It uses the hardcoded URL if one exists (for exceptions), otherwise it creates one.
                const imageUrl = article.imageUrl || `${IMG_DIR}/${article.id}.png`;
                const articleUrl = article.article_url || `${PDF_DIR}/${article.id}.pdf`;

                card.className = 'article-card bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 hover:shadow-xl transition-all duration-500 ease-out flex flex-col opacity-0 translate-y-5';
                card.innerHTML = `
                    <img class="card-image w-full" src="${imageUrl}" alt="Abstract image representing ${article.title}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/FFFFFF?text=Image+Not+Found';">
                    <div class="p-6 flex-grow flex flex-col">
                        <div class="flex-grow">
                            <p class="text-sm text-gray-500 mb-1">${article.publication} &bull; ${new Date(article.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                            <h3 class="text-2xl font-bold text-gray-800 mb-3">${article.title}</h3>
                            <p class="text-gray-600 leading-relaxed mb-4">${article.summary}</p>
                        </div>
                        <div class="pt-4 mt-auto bg-white">
                            <div class="flex items-center">
                                <button onclick="openPdfModal('${articleUrl}', '${article.title.replace(/'/g, "'")}')" class="read-more-btn">Read More &rarr;</button>
                            </div>
                        </div>
                    </div>
                `;
                portfolioGrid.appendChild(card);
            });

            // Observe cards for scroll animations
            if (cardObserver) {
                portfolioGrid.querySelectorAll('.article-card').forEach(card => cardObserver.observe(card));
            }

            // Handle pagination controls visibility
            if (currentArticles.length <= ARTICLES_PER_PAGE) {
                paginationControls.classList.add('hidden');
            } else {
                paginationControls.classList.remove('hidden');
                
                // "See More" button visibility
                if (articlesToShow >= currentArticles.length) {
                    seeMoreBtn.classList.add('hidden');
                } else {
                    seeMoreBtn.classList.remove('hidden');
                }

                // "See Less" button visibility
                if (articlesToShow > ARTICLES_PER_PAGE) {
                    seeLessBtn.classList.remove('hidden');
                } else {
                    seeLessBtn.classList.add('hidden');
                }
            }
        }

        // Generic function to render filter buttons
        function renderFilterButtons(container, items) {
            const allItems = [...new Set(items)].sort();
            container.innerHTML = allItems.map(item => `
                <button data-filter="${item}" class="tag bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-full shadow-sm hover:bg-gray-100">
                    ${item}
                </button>
            `).join('');
        }

        // Function to apply all active filters and re-render the articles
        function applyFiltersAndRender(withTransition = false) {
            const updateContent = () => {
                let filteredArticles = [...articles];

                // Apply Topic filters (multi-select)
                if (activeTopicFilters.length > 0) {
                    filteredArticles = filteredArticles.filter(article => {
                        return activeTopicFilters.every(filter => {
                            if (filter === 'Fraud & Security') {
                                return article.tags.includes('Fraud') || article.tags.includes('Security');
                            }
                            return article.tags.includes(filter);
                        });
                    });
                }

                // Apply Genre filter (single-select)
                if (activeGenreFilter !== 'All') {
                    filteredArticles = filteredArticles.filter(a => a.genre === activeGenreFilter);
                }

                currentArticles = filteredArticles.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
                articlesToShow = ARTICLES_PER_PAGE; // Reset pagination
                
                if (activeTopicFilters.length === 0 && activeGenreFilter === 'All') {
                    portfolioHeading.textContent = "All Work";
                } else {
                    portfolioHeading.textContent = "Filtered Results";
                }
                
                renderArticles();
                updateURLWithFilters();
                updateActiveButtons();
                toggleClearActiveFiltersButton();

                if (withTransition) {
                    portfolioGrid.style.opacity = 1;
                }
            };

            if (withTransition) {
                portfolioGrid.style.opacity = 0;
                setTimeout(updateContent, 200);
            } else {
                updateContent();
            }
        }

        // Function to handle "See More" click
        function handleSeeMore() {
            articlesToShow += ARTICLES_PER_PAGE;
            renderArticles();
        }

        // Function to handle "See Less" click
        function handleSeeLess() {
            articlesToShow = ARTICLES_PER_PAGE;
            renderArticles();
            window.scrollTo({ top: portfolioGrid.offsetTop - 100, behavior: 'smooth' });
        }
        
        // Updates all filter groups
        function updateActiveButtons() {
            // Update multi-select topic buttons
            const topicButtons = tagFiltersContainer.querySelectorAll('button');
            topicButtons.forEach(button => {
                button.classList.toggle('active-tag', tempTopicFilters.includes(button.dataset.filter));
            });
            // Update single-select genre buttons
            const genreButtons = genreFiltersContainer.querySelectorAll('button');
            genreButtons.forEach(button => {
                button.classList.toggle('active-tag', button.dataset.filter === tempGenreFilter);
            });
        }

        function toggleClearActiveFiltersButton() {
            const areFiltersActive = activeTopicFilters.length > 0 || activeGenreFilter !== 'All';
            activeFiltersContainer.classList.toggle('hidden', !areFiltersActive);
        }

        // --- URL State Management ---
        function updateURLWithFilters() {
            const params = new URLSearchParams();
            if (activeTopicFilters.length > 0) {
                params.set('topics', activeTopicFilters.join(','));
            }
            if (activeGenreFilter !== 'All') {
                params.set('genre', activeGenreFilter);
            }
            
            const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            history.pushState({path: newUrl}, '', newUrl);
        }

        function applyFiltersFromURL() {
            const params = new URLSearchParams(window.location.search);
            const topics = params.get('topics');
            const genre = params.get('genre');

            if (topics) {
                activeTopicFilters = topics.split(',');
            }
            if (genre) {
                activeGenreFilter = genre;
            }
            
            tempTopicFilters = [...activeTopicFilters];
            tempGenreFilter = activeGenreFilter;
        }

        // --- Modal Control ---
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-95');
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.add('opacity-0');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('pointer-events-none'), 250);

            if (modalId === 'pdf-modal') {
                const pdfViewer = document.getElementById('pdf-viewer');
                pdfViewer.src = '';
            }
        }

        function openPdfModal(pdfUrl, title) {
            const pdfViewer = document.getElementById('pdf-viewer');
            const pdfTitle = document.getElementById('pdf-title');
            
            pdfTitle.textContent = title;
            pdfViewer.src = pdfUrl;
            
            openModal('pdf-modal');
        }

        // --- Initial Setup ---
        document.addEventListener('DOMContentLoaded', () => {
            // Wrap all logic in an IIFE to avoid polluting the global namespace
            (function() {

            // --- Animation on Scroll Logic ---
            cardObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    // When the element is in view, animate it by removing the initial state classes
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('opacity-0', 'translate-y-5');
                        observer.unobserve(entry.target); // Stop observing it once it's visible to save resources
                    }
                });
            }, {
                rootMargin: '0px 0px -100px 0px' // Start animation when the element is 100px up from the bottom of the viewport
            });

            // Render all filter buttons
            const allTags = articles.flatMap(a => a.tags);
            const allGenres = articles.map(a => a.genre);
            
            // Special 'Fraud & Security' filter
            const uniqueTags = [...new Set(allTags)];
            renderFilterButtons(tagFiltersContainer, ['Fraud & Security', ...uniqueTags]);
            renderFilterButtons(genreFiltersContainer, allGenres);

            applyFiltersFromURL(); // Read from URL first to set initial state
            applyFiltersAndRender();
            
            // --- New Filter Panel Logic ---
            const filterToggleBtn = document.getElementById('filter-toggle-btn');
            const filterPanel = document.getElementById('filter-panel');
            const filterChevron = document.getElementById('filter-chevron');
            const closeFilterBtn = document.getElementById('close-filter-btn');

            const openFilterPanel = () => {
                // Reset temp filters to match active filters whenever panel is opened
                tempTopicFilters = [...activeTopicFilters];
                tempGenreFilter = activeGenreFilter;
                updateActiveButtons();
                applyBtnContainer.classList.add('hidden'); // Hide apply button initially

                filterPanel.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                filterChevron.classList.add('rotate-180');
                filterToggleBtn.setAttribute('aria-expanded', 'true');
            };

            const closeFilterPanel = () => {
                filterPanel.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                filterChevron.classList.remove('rotate-180');
                filterToggleBtn.setAttribute('aria-expanded', 'false');
                toggleClearActiveFiltersButton();
            };

            filterToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = filterToggleBtn.getAttribute('aria-expanded') === 'true';
                isExpanded ? closeFilterPanel() : openFilterPanel();
            });

            closeFilterBtn.addEventListener('click', () => {
                closeFilterPanel();
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                const isExpanded = filterToggleBtn.getAttribute('aria-expanded') === 'true';
                if (isExpanded && !filterPanel.contains(e.target) && !filterToggleBtn.contains(e.target)) {
                    closeFilterPanel();
                }
            });

            // Add event listeners
            tagFiltersContainer.addEventListener('click', e => {
                if (e.target.tagName !== 'BUTTON') return;
                const clickedFilter = e.target.dataset.filter;
                const filterIndex = tempTopicFilters.indexOf(clickedFilter);

                if (filterIndex > -1) {
                    tempTopicFilters.splice(filterIndex, 1); // Deselect if already active
                } else {
                    tempTopicFilters.push(clickedFilter); // Select if not active
                }
                updateActiveButtons();
                applyBtnContainer.classList.remove('hidden');
            });

            genreFiltersContainer.addEventListener('click', e => {
                if (e.target.tagName !== 'BUTTON') return;
                tempGenreFilter = tempGenreFilter === e.target.dataset.filter ? 'All' : e.target.dataset.filter;
                updateActiveButtons();
                applyBtnContainer.classList.remove('hidden');
            });
            
            applyFiltersBtn.addEventListener('click', () => {
                activeTopicFilters = [...tempTopicFilters];
                activeGenreFilter = tempGenreFilter;
                applyFiltersAndRender(true);
                applyBtnContainer.classList.add('hidden');
                closeFilterPanel();
            });

            clearTopicFilterBtn.addEventListener('click', () => {
                tempTopicFilters = [];
                updateActiveButtons();
                applyBtnContainer.classList.remove('hidden');
            });

            clearGenreFilterBtn.addEventListener('click', () => {
                tempGenreFilter = 'All';
                updateActiveButtons();
                applyBtnContainer.classList.remove('hidden');
            });

            clearAllFiltersBtn.addEventListener('click', () => {
                tempTopicFilters = [];
                tempGenreFilter = 'All';
                updateActiveButtons();
                applyBtnContainer.classList.remove('hidden');
            });

            clearActiveFiltersBtn.addEventListener('click', () => {
                activeTopicFilters = [];
                activeGenreFilter = 'All';
                tempTopicFilters = [];
                tempGenreFilter = 'All';
                applyFiltersAndRender(true);
                updateActiveButtons();
            });

            seeMoreBtn.addEventListener('click', handleSeeMore);
            seeLessBtn.addEventListener('click', handleSeeLess);
            
            // --- Sticky Header Indicator Logic ---
            const stickyFilterBar = document.querySelector('.sticky');
            const observer = new IntersectionObserver(
                ([e]) => {
                    // e.intersectionRatio < 1 means the top of the element is no longer visible in the viewport
                    stickyFilterBar.classList.toggle('is-sticky', e.intersectionRatio < 1);
                },
                {
                    threshold: [1], // Fire event when element is fully in/out of view
                    rootMargin: "-1px 0px 0px 0px" // Trigger just before it's flush with the top
                }
            );
            observer.observe(stickyFilterBar);

            // --- Back to Top Button Logic ---
            const backToTopBtn = document.getElementById('back-to-top-btn');

            window.addEventListener('scroll', () => {
                // Show button after scrolling down 400px
                if (window.scrollY > 400) {
                    backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
                } else {
                    backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
                }
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal('colophon-modal');
                    closeModal('pdf-modal');
                }
            });

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal.id);
                    }
                });
            });

            })(); // End of IIFE
        });

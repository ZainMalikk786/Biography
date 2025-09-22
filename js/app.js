/**
 * Portfolio Website - Main JavaScript
 * 
 * Developer Notes:
 * - To change site title: Update the <title> tags in HTML files
 * - To change accent color: Update --accent CSS variable in main.css
 * - To change batch path: Update the BATCH_PATH constant below
 */

// Constants
const BATCH_PATH = '/batches/';
const POSTS_PER_BATCH = 15;
const FEATURED_POSTS_COUNT = 3;

// State
let currentBatch = 1;
let allPosts = [];
let filteredPosts = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const modal = document.getElementById('post-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.querySelector('.modal-close');
const postsContainer = document.getElementById('posts-container');
const featuredPostsContainer = document.getElementById('featured-posts-container');
const batchLinksContainer = document.getElementById('batch-links');
const tagFiltersContainer = document.getElementById('tag-filters');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Initialize the application
function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Load appropriate content based on page
    if (document.body.contains(featuredPostsContainer)) {
        // Home page - load featured posts
        loadFeaturedPosts();
    } else if (document.body.contains(postsContainer)) {
        // Category page - load posts
        detectCategory();
        loadBatchNavigation();
        loadTags();
        loadPosts();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Modal close
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Search functionality
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', 
        navToggle.getAttribute('aria-expanded') === 'false' ? 'true' : 'false');
}

// Open modal with post content
function openModal(post) {
    modalBody.innerHTML = `
        <h2 id="modal-title">${post.title}</h2>
        <div class="post-meta">
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            <span> • ${post.type}</span>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
            </div>
        ` : ''}
    `;
    
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.classList.add('active');
    
    // Trap focus inside modal
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    firstFocusableElement.focus();
    
    modal.addEventListener('keydown', function trapTabKey(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    e.preventDefault();
                    lastFocusableElement.focus();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    e.preventDefault();
                    firstFocusableElement.focus();
                }
            }
        }
    });
}

// Close modal
function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-modal', 'false');
    modal.classList.remove('active');
}

// Detect current category from URL
function detectCategory() {
    const path = window.location.pathname;
    if (path.includes('quotes')) return 'quote';
    if (path.includes('poetry')) return 'poem';
    if (path.includes('thoughts')) return 'thought';
    return 'all';
}

// Load batch navigation
function loadBatchNavigation() {
    // In a real implementation, you would fetch the number of batches available
    // For this demo, we'll assume we have 2 batches
    const totalBatches = 2;
    
    let html = '';
    for (let i = 1; i <= totalBatches; i++) {
        html += `
            <button class="batch-link ${i === currentBatch ? 'active' : ''}" 
                    data-batch="${i}" 
                    aria-label="View batch ${i}">
                Batch ${i}
            </button>
        `;
    }
    
    batchLinksContainer.innerHTML = html;
    
    // Add event listeners to batch links
    const batchLinks = batchLinksContainer.querySelectorAll('.batch-link');
    batchLinks.forEach(link => {
        link.addEventListener('click', () => {
            const batchNum = parseInt(link.getAttribute('data-batch'));
            loadBatch(batchNum);
        });
    });
}

// Load tags for filtering
function loadTags() {
    // Tags would normally be loaded from all posts
    // For this demo, we'll use a predefined set
    const tags = ['philosophy', 'life', 'love', 'wisdom', 'reflection', 'knowledge', 'curiosity', 'inspiration'];
    
    let html = `
        <button class="tag-filter active" data-tag="all">All</button>
    `;
    
    tags.forEach(tag => {
        html += `
            <button class="tag-filter" data-tag="${tag}">${tag}</button>
        `;
    });
    
    tagFiltersContainer.innerHTML = html;
    
    // Add event listeners to tag filters
    const tagFilters = tagFiltersContainer.querySelectorAll('.tag-filter');
    tagFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            const tag = filter.getAttribute('data-tag');
            applyFilter(tag);
        });
    });
}

// Load a specific batch of posts
function loadBatch(batchNum) {
    currentBatch = batchNum;
    
    // Update active batch link
    const batchLinks = batchLinksContainer.querySelectorAll('.batch-link');
    batchLinks.forEach(link => {
        const linkBatch = parseInt(link.getAttribute('data-batch'));
        if (linkBatch === batchNum) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Load the batch data
    fetch(`${BATCH_PATH}batch-${String(batchNum).padStart(3, '0')}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Batch not found');
            }
            return response.json();
        })
        .then(posts => {
            allPosts = posts;
            applyFilter(currentFilter);
        })
        .catch(error => {
            console.error('Error loading batch:', error);
            postsContainer.innerHTML = `
                <div class="text-center">
                    <p>Unable to load posts. Please try again later.</p>
                </div>
            `;
        });
}

// Apply filter to posts
function applyFilter(tag) {
    currentFilter = tag;
    
    // Update active tag filter
    const tagFilters = tagFiltersContainer.querySelectorAll('.tag-filter');
    tagFilters.forEach(filter => {
        const filterTag = filter.getAttribute('data-tag');
        if (filterTag === tag) {
            filter.classList.add('active');
        } else {
            filter.classList.remove('active');
        }
    });
    
    // Filter posts
    const category = detectCategory();
    filteredPosts = allPosts.filter(post => {
        // Filter by category if not on home page
        if (category !== 'all' && post.type !== category) {
            return false;
        }
        
        // Filter by tag
        if (tag !== 'all' && (!post.tags || !post.tags.includes(tag))) {
            return false;
        }
        
        // Filter by search term
        if (currentSearchTerm && 
            !post.title.toLowerCase().includes(currentSearchTerm) && 
            !post.content.toLowerCase().includes(currentSearchTerm)) {
            return false;
        }
        
        return true;
    });
    
    renderPosts();
}

// Handle search
function handleSearch() {
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    applyFilter(currentFilter);
}

// Render posts to the container
function renderPosts() {
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `
            <div class="text-center">
                <p>No posts found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredPosts.forEach(post => {
        html += `
            <article class="post-card" data-id="${post.id}" tabindex="0">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <time datetime="${post.date}">${formatDate(post.date)}</time>
                    <span> • ${post.type}</span>
                </div>
                <p>${truncateText(removeHtmlTags(post.content), 200)}</p>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.slice(0, 3).map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                        ${post.tags.length > 3 ? `<span class="post-tag">+${post.tags.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </article>
        `;
    });
    
    postsContainer.innerHTML = html;
    
    // Add event listeners to post cards
    const postCards = postsContainer.querySelectorAll('.post-card');
    postCards.forEach(card => {
        card.addEventListener('click', () => {
            const postId = card.getAttribute('data-id');
            const post = filteredPosts.find(p => p.id === postId);
            if (post) {
                openModal(post);
            }
        });
        
        // Make cards keyboard accessible
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const postId = card.getAttribute('data-id');
                const post = filteredPosts.find(p => p.id === postId);
                if (post) {
                    openModal(post);
                }
            }
        });
    });
}

// Load featured posts for home page
function loadFeaturedPosts() {
    // Load the latest batch to get featured posts
    fetch(`${BATCH_PATH}batch-002.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Batch not found');
            }
            return response.json();
        })
        .then(posts => {
            // Take the latest posts
            const featuredPosts = posts
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, FEATURED_POSTS_COUNT);
            
            renderFeaturedPosts(featuredPosts);
        })
        .catch(error => {
            console.error('Error loading featured posts:', error);
            featuredPostsContainer.innerHTML = `
                <div class="text-center">
                    <p>Unable to load featured posts. Please try again later.</p>
                </div>
            `;
        });
}

// Render featured posts
function renderFeaturedPosts(posts) {
    let html = '';
    posts.forEach(post => {
        html += `
            <article class="post-card" data-id="${post.id}" tabindex="0">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <time datetime="${post.date}">${formatDate(post.date)}</time>
                    <span> • ${post.type}</span>
                </div>
                <p>${truncateText(removeHtmlTags(post.content), 150)}</p>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.slice(0, 2).map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `;
    });
    
    featuredPostsContainer.innerHTML = html;
    
    // Add event listeners to featured post cards
    const postCards = featuredPostsContainer.querySelectorAll('.post-card');
    postCards.forEach(card => {
        card.addEventListener('click', () => {
            const postId = card.getAttribute('data-id');
            // For featured posts, we need to find the post in its batch
            openFeaturedPost(postId);
        });
        
        // Make cards keyboard accessible
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const postId = card.getAttribute('data-id');
                openFeaturedPost(postId);
            }
        });
    });
}

// Open a featured post (may need to load from correct batch)
function openFeaturedPost(postId) {
    // This is a simplified implementation
    // In a real scenario, you might need to check which batch the post is in
    fetch(`${BATCH_PATH}batch-002.json`)
        .then(response => response.json())
        .then(posts => {
            const post = posts.find(p => p.id === postId);
            if (post) {
                openModal(post);
            }
        })
        .catch(error => {
            console.error('Error loading post:', error);
        });
}

// Load posts for current category
function loadPosts() {
    loadBatch(currentBatch);
}

// Utility function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Utility function to remove HTML tags for preview
function removeHtmlTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Batch JSON validation utility
function validateBatchJson(batchData) {
    if (!Array.isArray(batchData)) {
        console.error('Batch data must be an array');
        return false;
    }
    
    if (batchData.length > POSTS_PER_BATCH) {
        console.warn(`Batch contains ${batchData.length} posts, recommended maximum is ${POSTS_PER_BATCH}`);
    }
    
    const requiredFields = ['id', 'type', 'title', 'content', 'date'];
    const validTypes = ['quote', 'poem', 'thought'];
    
    for (let i = 0; i < batchData.length; i++) {
        const post = batchData[i];
        
        // Check required fields
        for (const field of requiredFields) {
            if (!post.hasOwnProperty(field)) {
                console.error(`Post at index ${i} is missing required field: ${field}`);
                return false;
            }
        }
        
        // Check type validity
        if (!validTypes.includes(post.type)) {
            console.error(`Post at index ${i} has invalid type: ${post.type}`);
            return false;
        }
        
        // Check date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
            console.error(`Post at index ${i} has invalid date format: ${post.date}`);
            return false;
        }
    }
    
    console.log('Batch JSON validation passed');
    return true;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export validation function for console use
window.validateBatchJson = validateBatchJson;

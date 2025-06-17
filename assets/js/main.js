const API_URL = 'http://localhost:3000/api';

new Vue({
    el: '#app',
    data: {
        lessons: [],
        cart: [],
        sort: {
            attribute: 'name',
            order: 'asc'
        },
        searchTerm: '',
        loading: true,
        // A timer variable for debouncing the search input
        searchDebounce: null
    },
    watch: {
        // Watch for changes on the searchTerm data property
        searchTerm(newValue, oldValue) {
            // Clear the previous debounce timer on each new character typed
            clearTimeout(this.searchDebounce);

            // Start a new timer to prevent firing search requests on every keystroke
            this.searchDebounce = setTimeout(() => {
                this.searchLessons();
            }, 300); // 300ms delay for a smooth "search as you type" experience
        }
    },
    computed: {
        cartItemCount() {
            // Calculates the total number of items in the cart for display in the header.
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
        sortedLessons() {
            // A computed property that now only sorts the lessons list.
            // Filtering is handled by the backend search.
            return [...this.lessons].sort((a, b) => {
                let comparison = 0;
                const attr = this.sort.attribute;

                // Handle sorting for string and number types
                if (a[attr] > b[attr]) {
                    comparison = 1;
                } else if (a[attr] < b[attr]) {
                    comparison = -1;
                }
                
                return this.sort.order === 'desc' ? -comparison : comparison;
            });
        }
    },
    methods: {
        fetchLessons() {
            // Fetches all lessons from the backend.
            this.loading = true;
            fetch(`${API_URL}/lessons`)
                .then(response => {
                    if (!response.ok) { throw new Error('Network response was not ok'); }
                    return response.json();
                })
                .then(data => {
                    this.lessons = data;
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Error fetching lessons:', error);
                    // Provide feedback to the user in the UI
                    this.lessons = [];
                    this.loading = false;
                });
        },
        searchLessons() {
            // If the search term is empty, fetch all lessons.
            if (!this.searchTerm.trim()) {
                this.fetchLessons();
                return;
            }

            // Otherwise, fetch lessons matching the search query.
            this.loading = true;
            // Using the /search endpoint as specified
            fetch(`${API_URL}/search?q=${this.searchTerm}`)
                .then(response => {
                     if (!response.ok) { throw new Error('Network response was not ok'); }
                     return response.json();
                })
                .then(data => {
                    this.lessons = data;
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Error searching lessons:', error);
                    this.lessons = []; // Clear lessons on search error
                    this.loading = false;
                });
        },
        addToCart(lesson) {
            // Adds a lesson to the shopping cart.
            if (lesson.availableSpaces > 0) {
                // The availableSpaces property on the lesson object itself is updated.
                // This updated lesson object is then added to the cart.
                lesson.availableSpaces--; 
                const cartItem = this.cart.find(item => item._id === lesson._id);
                if (cartItem) {
                    // If item is already in cart, just increase its quantity
                    cartItem.quantity++;
                    // Also update the spaces count in the existing cart item
                    cartItem.availableSpaces = lesson.availableSpaces;
                } else {
                    // Otherwise, add the new lesson to the cart
                    this.cart.push({ ...lesson, quantity: 1 });
                }
                this.saveCart(); // Persist cart to localStorage
            }
        },
        saveCart() {
            // Saves the current state of the cart to the browser's localStorage.
            localStorage.setItem('booklyCart', JSON.stringify(this.cart));
        },
        loadCart() {
             // Loads the cart from localStorage when the app is initialized.
             const savedCart = localStorage.getItem('booklyCart');
             if (savedCart) {
                 this.cart = JSON.parse(savedCart);
             }
        }
    },
    created() {
        // This hook runs when the Vue instance is created.
        this.fetchLessons(); // Initial fetch of all lessons
        this.loadCart();

        // Add an event listener to sync the cart across different browser tabs.
        window.addEventListener('storage', (event) => {
            if (event.key === 'booklyCart') {
                this.cart = JSON.parse(event.newValue || '[]');
            }
        });
    }
});

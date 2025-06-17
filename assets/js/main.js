new Vue({
    el: '#app',
    data: {
        backendUrl: 'http://localhost:3000',
        lessons: [],
        cart: [],
        sort: {
            attribute: 'name',
            order: 'asc'
        },
        searchTerm: '',
        loading: true,
        searchDebounce: null
    },
    watch: {
        searchTerm(newValue, oldValue) {
            clearTimeout(this.searchDebounce);
            this.searchDebounce = setTimeout(() => {
                this.searchLessons();
            }, 300);
        }
    },
    computed: {
        cartItemCount() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
        sortedLessons() {
            return [...this.lessons].sort((a, b) => {
                let comparison = 0;
                const attr = this.sort.attribute;
                if (a[attr] > b[attr]) comparison = 1;
                else if (a[attr] < b[attr]) comparison = -1;
                return this.sort.order === 'desc' ? -comparison : comparison;
            });
        }
    },
    methods: {
        fetchLessons() {
            this.loading = true;
            fetch(`${this.backendUrl}/api/lessons`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    this.lessons = data;
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Error fetching lessons:', error);
                    this.lessons = [];
                    this.loading = false;
                });
        },
        searchLessons() {
            if (!this.searchTerm.trim()) {
                this.fetchLessons();
                return;
            }
            this.loading = true;
            fetch(`${this.backendUrl}/api/search?q=${this.searchTerm}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    this.lessons = data;
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Error searching lessons:', error);
                    this.lessons = [];
                    this.loading = false;
                });
        },
        addItem(lesson) {
            if (lesson.availableSpaces <= 0) return; // Safety check

            lesson.availableSpaces--; // Decrease spaces in the main lessons list
            const cartItem = this.cart.find(item => item._id === lesson._id);

            if (cartItem) {
                cartItem.quantity++;
            } else {
                // Add lesson to cart with quantity of 1
                this.cart.push({ ...lesson, quantity: 1 });
            }
            this.saveCart();
        },
        removeItem(lesson) {
            const cartItem = this.cart.find(item => item._id === lesson._id);
            if (!cartItem) return;

            lesson.availableSpaces++; // Increase spaces in the main lessons list
            cartItem.quantity--;

            // If quantity drops to 0, remove the item from the cart array completely
            if (cartItem.quantity === 0) {
                const cartIndex = this.cart.findIndex(item => item._id === lesson._id);
                this.cart.splice(cartIndex, 1);
            }
            this.saveCart();
        },
        getCartQuantity(lessonId) {
            const cartItem = this.cart.find(item => item._id === lessonId);
            return cartItem ? cartItem.quantity : 0;
        },
        saveCart() {
            localStorage.setItem('booklyCart', JSON.stringify(this.cart));
        },
        loadCart() {
            const savedCart = localStorage.getItem('booklyCart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        imageLoadError(event) {
            // Provides a fallback image if the intended one fails to load
            event.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';
        }
    },
    created() {
        this.fetchLessons();
        this.loadCart();
        window.addEventListener('storage', (event) => {
            if (event.key === 'booklyCart') {
                this.cart = JSON.parse(event.newValue || '[]');
            }
        });
    }
});

new Vue({
    el: '#cart-app',
    data: {
        //backendUrl: 'http://localhost:3000',
        backendUrl: 'https://bookly-api-f8mw.onrender.com',
        cart: [],
        order: {
            name: '',
            phone: ''
        },
        orderPlaced: false,
        isSubmitting: false
    },
    computed: {
        isNameValid() {
            return /^[A-Za-z\s]+$/.test(this.order.name);
        },
        isPhoneValid() {
            return /^[0-9]+$/.test(this.order.phone);
        },
        isCheckoutValid() {
            return this.isNameValid && this.isPhoneValid && this.cart.length > 0 && !this.isSubmitting;
        },
        totalCost() {
            return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        }
    },
    methods: {
        loadCart() {
            const savedCart = localStorage.getItem('booklyCart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        saveCart() {
            localStorage.setItem('booklyCart', JSON.stringify(this.cart));
        },
        removeFromCart(index) {
            this.cart.splice(index, 1);
            this.saveCart();
        },
        submitOrder() {
            if (!this.isCheckoutValid) return;

            this.isSubmitting = true;

            const spacesToBook = this.cart.reduce((obj, item) => {
                obj[item._id] = item.quantity;
                return obj;
            }, {});

            const orderData = {
                name: this.order.name,
                phone: this.order.phone,
                lessonIds: this.cart.map(item => item._id),
                spaces: spacesToBook
            };

            const cartForUpdate = [...this.cart];
            
            fetch(`${this.backendUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            })
            .then(response => {
                if (!response.ok) { throw new Error('Order submission failed'); }
                return response.json();
            })
            .then(data => {
                console.log('Order successful:', data);
                const updatePromises = cartForUpdate.map(item => {
                    const updatedSpaces = item.availableSpaces - item.quantity;
                    return fetch(`${this.backendUrl}/api/lessons/${item._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ availableSpaces: updatedSpaces })
                    });
                });
                return Promise.all(updatePromises);
            })
            .then(responses => {
                responses.forEach(res => {
                    if (!res.ok) throw new Error('Failed to update one or more lessons.');
                });
                console.log('All lessons updated successfully.');
                this.orderPlaced = true;
                this.cart = [];
                this.saveCart();
                this.order.name = '';
                this.order.phone = '';
                setTimeout(() => { this.orderPlaced = false; }, 5000);
            })
            .catch(error => {
                console.error('An error occurred during checkout:', error);
            })
            .finally(() => {
                this.isSubmitting = false;
            });
        },
        imageLoadError(event) {
            event.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';
        }
    },
    created() {
        this.loadCart();
        window.addEventListener('storage', (event) => {
            if (event.key === 'booklyCart') {
                this.cart = JSON.parse(event.newValue || '[]');
            }
        });
    }
});

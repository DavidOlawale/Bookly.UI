
const API_URL = 'http://localhost:3000/api';

new Vue({
    el: '#cart-app',
    data: {
        cart: [],
        order: {
            name: '',
            phone: ''
        },
        orderPlaced: false
    },
    computed: {
        isNameValid() {
            // Validates that the name contains only letters and spaces.
            return /^[A-Za-z\s]+$/.test(this.order.name);
        },
        isPhoneValid() {
            // Validates that the phone number contains only numbers.
            return /^[0-9]+$/.test(this.order.phone);
        },
        isCheckoutValid() {
            // The checkout button is enabled only if the form is valid and the cart is not empty.
            return this.isNameValid && this.isPhoneValid && this.cart.length > 0;
        },
        totalCost() {
            // Calculates the total cost of all items in the cart.
            return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        }
    },
    methods: {
        loadCart() {
            // Loads the cart from localStorage when the page is loaded.
            const savedCart = localStorage.getItem('booklyCart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        saveCart() {
            // Saves the current cart state to localStorage.
            localStorage.setItem('booklyCart', JSON.stringify(this.cart));
        },
        removeFromCart(index) {
            // Removes an item from the cart and updates localStorage.
            // Note: For a real application, you'd need a more robust way to sync
            // the available spaces back to the main lessons list, likely by
            // updating the data on the server.
            this.cart.splice(index, 1);
            this.saveCart();
        },
        submitOrder() {
            if (!this.isCheckoutValid) return;

            const orderData = {
                name: this.order.name,
                phone: this.order.phone,
                lessonIds: this.cart.map(item => item._id),
                spaces: this.cart.reduce((obj, item) => {
                    obj[item._id] = item.quantity;
                    return obj;
                }, {})
            };
            
            console.log("Submitting Order:", orderData);

            // This is where you would send the order data to your backend.
            // The fetch call is commented out for now.
            // fetch(`${API_URL}/orders`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(orderData)
            // }).then(response => response.json())
            // .then(data => {
            //     console.log('Order successful:', data);
            //     this.orderPlaced = true;
            //     this.cart = [];
            //     this.saveCart();
            //     // You would also need to trigger PUT requests here to update 
            //     // the 'availableSpaces' for each lesson on the server.
            // })
            // .catch(error => console.error('Error submitting order:', error));

            // Mocking the successful order submission for demonstration.
            setTimeout(() => {
                this.orderPlaced = true; // Show confirmation message
                this.cart = []; // Clear the cart
                this.saveCart(); // Update localStorage
                // Reset the form fields
                this.order.name = '';
                this.order.phone = '';

                 // Hide the success message after a few seconds
                 setTimeout(() => { this.orderPlaced = false; }, 5000);
            }, 1000);
        }
    },
    created() {
        // Load the cart from localStorage as soon as the page is ready.
        this.loadCart();
        
        // Listen for storage events to keep the cart in sync with other open tabs.
        window.addEventListener('storage', (event) => {
            if (event.key === 'booklyCart') {
                this.cart = JSON.parse(event.newValue);
            }
        });
    }
});

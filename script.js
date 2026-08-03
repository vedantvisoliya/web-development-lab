/* ============================================================
   Book Store - JavaScript functionality
   - Cart handling with localStorage (add / remove / quantity)
   - Cart count shown next to the "Cart" nav link
   - Cart page rendering with total price
   - Registration form validation
   ============================================================ */

var CART_KEY = "bookstore_cart";
var USER_KEY = "bookstore_user";
var REDIRECT_KEY = "bookstore_after_login";

/* ---------- Cart storage helpers ---------- */

function getCart() {
    var data = localStorage.getItem(CART_KEY);
    if (!data) {
        return [];
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(book) {
    var cart = getCart();
    var found = false;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === book.id) {
            cart[i].qty = cart[i].qty + 1;
            found = true;
            break;
        }
    }

    if (!found) {
        book.qty = 1;
        cart.push(book);
    }

    saveCart(cart);
    updateCartCount();
}

function removeFromCart(id) {
    var cart = getCart();
    var newCart = [];

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id !== id) {
            newCart.push(cart[i]);
        }
    }

    saveCart(newCart);
    updateCartCount();
    renderCart();
}

function changeQty(id, delta) {
    var cart = getCart();

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].qty = cart[i].qty + delta;
            if (cart[i].qty < 1) {
                cart[i].qty = 1;
            }
            break;
        }
    }

    saveCart(cart);
    updateCartCount();
    renderCart();
}

function getCartCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
        count = count + cart[i].qty;
    }
    return count;
}

/* ---------- Show item count next to the Cart link ---------- */

function updateCartCount() {
    var links = document.querySelectorAll("nav a");
    var count = getCartCount();

    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === "cart.html") {
            if (count > 0) {
                links[i].textContent = "Cart (" + count + ")";
            } else {
                links[i].textContent = "Cart";
            }
        }
    }
}

/* ---------- Login state helpers ---------- */

function getUser() {
    return localStorage.getItem(USER_KEY);
}

function setUser(name) {
    localStorage.setItem(USER_KEY, name);
}

function logoutUser() {
    localStorage.removeItem(USER_KEY);
}

/* Show "Logout (name)" on the Login link when a user is signed in */
function updateAuthLink() {
    var links = document.querySelectorAll("nav a");
    var user = getUser();

    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === "login.html") {
            if (user) {
                links[i].textContent = "Logout (" + user + ")";
                links[i].setAttribute("href", "#");
                links[i].addEventListener("click", function (event) {
                    event.preventDefault();
                    logoutUser();
                    window.location.reload();
                });
            } else {
                links[i].textContent = "Login";
            }
        }
    }
}

/* ---------- Catalogue page: wire up "Add to Cart" buttons ---------- */

function setupCatalogue() {
    var cards = document.querySelectorAll(".book-card");
    if (cards.length === 0) {
        return;
    }

    for (var i = 0; i < cards.length; i++) {
        (function (card) {
            var button = card.querySelector("button");
            if (!button) {
                return;
            }

            button.addEventListener("click", function () {
                var book = {
                    id: card.getAttribute("data-id"),
                    title: card.getAttribute("data-title"),
                    author: card.getAttribute("data-author"),
                    price: Number(card.getAttribute("data-price")),
                    image: card.getAttribute("data-image")
                };

                addToCart(book);

                // simple feedback on the button
                var original = button.textContent;
                button.textContent = "Added ✓";
                button.disabled = true;
                setTimeout(function () {
                    button.textContent = original;
                    button.disabled = false;
                }, 900);
            });
        })(cards[i]);
    }
}

/* ---------- Cart page: render the items ---------- */

function renderCart() {
    var container = document.getElementById("cart-content");
    if (!container) {
        return;
    }

    var cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    var total = 0;
    var html = "";

    html += '<table class="cart-table">';
    html += "<thead><tr>";
    html += "<th>Cover</th><th>Book</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th>";
    html += "</tr></thead><tbody>";

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var subtotal = item.price * item.qty;
        total = total + subtotal;

        html += "<tr>";
        html += '<td><img class="cart-cover" src="' + item.image + '" alt="' + item.title + ' cover"></td>';
        html += '<td class="cart-title">' + item.title + "<span>by " + item.author + "</span></td>";
        html += "<td>Rs. " + item.price + "</td>";
        html += '<td class="cart-qty">';
        html += '<button type="button" class="qty-btn" data-action="dec" data-id="' + item.id + '">-</button>';
        html += "<span>" + item.qty + "</span>";
        html += '<button type="button" class="qty-btn" data-action="inc" data-id="' + item.id + '">+</button>';
        html += "</td>";
        html += "<td>Rs. " + subtotal + "</td>";
        html += '<td><button type="button" class="remove-btn" data-id="' + item.id + '">Remove</button></td>';
        html += "</tr>";
    }

    html += "</tbody></table>";
    html += '<p class="cart-total">Total: Rs. ' + total + "</p>";
    html += '<div class="cart-actions">';
    html += '<button type="button" id="checkout-btn">Proceed to Checkout</button>';
    html += "</div>";
    html += '<div id="cart-message"></div>';

    container.innerHTML = html;

    // wire up the buttons we just created
    var qtyButtons = container.querySelectorAll(".qty-btn");
    for (var q = 0; q < qtyButtons.length; q++) {
        qtyButtons[q].addEventListener("click", function () {
            var id = this.getAttribute("data-id");
            var action = this.getAttribute("data-action");
            changeQty(id, action === "inc" ? 1 : -1);
        });
    }

    var removeButtons = container.querySelectorAll(".remove-btn");
    for (var r = 0; r < removeButtons.length; r++) {
        removeButtons[r].addEventListener("click", function () {
            removeFromCart(this.getAttribute("data-id"));
        });
    }

    var checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", checkout);
    }
}

/* ---------- Checkout (requires login / registration first) ---------- */

function checkout() {
    var messageBox = document.getElementById("cart-message");

    if (!getUser()) {
        // Not logged in: remember where to come back to, then send to login
        localStorage.setItem(REDIRECT_KEY, "cart.html");

        if (messageBox) {
            messageBox.className = "form-message error";
            messageBox.innerHTML =
                "Please login or register before checking out. " +
                'Redirecting to the login page…';
        }

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1200);
        return;
    }

    // Logged in: place the order
    saveCart([]);
    updateCartCount();

    if (messageBox) {
        messageBox.className = "form-message success";
        messageBox.textContent =
            "Thank you, " + getUser() + "! Your order has been placed successfully.";
    }

    // clear the item list but keep the message visible
    var table = document.querySelector(".cart-table");
    if (table) {
        table.style.display = "none";
    }
    var total = document.querySelector(".cart-total");
    if (total) {
        total.style.display = "none";
    }
    var actions = document.querySelector(".cart-actions");
    if (actions) {
        actions.style.display = "none";
    }
}

/* ---------- Registration form validation ---------- */

function setupRegistration() {
    var form = document.getElementById("registration-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        var name = document.getElementById("name").value.trim();
        var password = document.getElementById("password").value;
        var email = document.getElementById("email").value.trim();
        var phone = document.getElementById("phone").value.trim();

        var errors = [];

        // Name: alphabets only, at least 6 characters
        var namePattern = /^[A-Za-z ]+$/;
        if (!namePattern.test(name) || name.replace(/ /g, "").length < 6) {
            errors.push("Name should contain only alphabets and be at least 6 characters long.");
        }

        // Password: at least 6 characters
        if (password.length < 6) {
            errors.push("Password should be at least 6 characters long.");
        }

        // Email: standard name@domain.com pattern
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            errors.push("E-mail id must follow the standard pattern (name@domain.com).");
        }

        // Phone: exactly 10 digits
        var phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phone)) {
            errors.push("Phone number should contain exactly 10 digits.");
        }

        var messageBox = document.getElementById("form-message");

        if (errors.length > 0) {
            event.preventDefault();
            messageBox.className = "form-message error";
            messageBox.innerHTML = "<ul><li>" + errors.join("</li><li>") + "</li></ul>";
        } else {
            event.preventDefault();
            setUser(name);
            messageBox.className = "form-message success";
            messageBox.textContent = "Registration successful! You are now logged in.";
            form.reset();
            redirectAfterAuth();
        }
    });
}

/* ---------- Login form (simple check) ---------- */

function setupLogin() {
    var form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var username = document.getElementById("username").value.trim();
        var password = document.getElementById("password").value;
        var messageBox = document.getElementById("form-message");

        if (username === "" || password === "") {
            messageBox.className = "form-message error";
            messageBox.textContent = "Please enter both username and password.";
        } else {
            setUser(username);
            messageBox.className = "form-message success";
            messageBox.textContent = "Welcome, " + username + "! You are now logged in.";
            redirectAfterAuth();
        }
    });
}

/* After a successful login/registration, return to checkout if that's where
   the user came from; otherwise stay on the page (links update on reload). */
function redirectAfterAuth() {
    var target = localStorage.getItem(REDIRECT_KEY);
    if (target) {
        localStorage.removeItem(REDIRECT_KEY);
        setTimeout(function () {
            window.location.href = target;
        }, 900);
    } else {
        setTimeout(function () {
            window.location.reload();
        }, 900);
    }
}

/* ---------- Run on every page ---------- */

document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    updateAuthLink();
    setupCatalogue();
    renderCart();
    setupRegistration();
    setupLogin();
});

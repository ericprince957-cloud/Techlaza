import { useState, useEffect, useCallback } from 'react';

// ============================================
// TECHLAZA - PRODUCT DATA
// All products with Nigerian pricing
// ============================================
const PRODUCTS = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop',
    description: '256GB, Titanium Blue. A17 Pro chip, 48MP camera system.',
    category: 'Phones'
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    price: 1150000,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop',
    description: '512GB, Titanium Black. Galaxy AI, 200MP camera, S-Pen.',
    category: 'Phones'
  },
  {
    id: 3,
    name: 'MacBook Pro M3',
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    description: '14-inch, 16GB RAM, 512GB SSD. M3 Pro chip, Liquid Retina XDR.',
    category: 'Laptops'
  },
  {
    id: 4,
    name: 'PlayStation 5 Slim',
    price: 650000,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
    description: 'Digital Edition, 1TB. Includes DualSense controller.',
    category: 'Gaming'
  },
  {
    id: 5,
    name: 'AirPods Pro 2nd Gen',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=300&fit=crop',
    description: 'USB-C, Active Noise Cancellation, Adaptive Audio.',
    category: 'Audio'
  },
  {
    id: 6,
    name: 'iPad Air M2',
    price: 850000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
    description: '11-inch, 128GB, Wi-Fi. M2 chip, Liquid Retina display.',
    category: 'Tablets'
  },
  {
    id: 7,
    name: 'Sony WH-1000XM5',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
    description: 'Wireless Noise Cancelling Headphones. 30hr battery life.',
    category: 'Audio'
  },
  {
    id: 8,
    name: 'Apple Watch Ultra 2',
    price: 750000,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop',
    description: '49mm Titanium Case. GPS + Cellular, Ocean Band.',
    category: 'Wearables'
  },
  {
    id: 9,
    name: 'Nintendo Switch OLED',
    price: 380000,
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop',
    description: '7-inch OLED Screen, 64GB Storage. White model.',
    category: 'Gaming'
  },
  {
    id: 10,
    name: 'DJI Mini 4 Pro',
    price: 950000,
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop',
    description: '4K/60fps HDR Video, Omnidirectional Obstacle Sensing.',
    category: 'Drones'
  }
];

// WhatsApp number for orders (replace with actual number)
const WHATSAPP_NUMBER = '2348012345678';

// ============================================
// PAYSTACK CONFIGURATION
// Replace pk_test_xxx with your actual Paystack public key
// ============================================
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatPrice(price: number): string {
  return '₦' + price.toLocaleString('en-NG');
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('techlaza-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [notification, setNotification] = useState<string | null>(null);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('techlaza-cart', JSON.stringify(cart));
  }, [cart]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cart Functions
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setNotification(`${product.name} added to cart!`);
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null as any;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ============================================
  // CHECKOUT FUNCTIONS
  // ============================================

  // Option A: Pay with Paystack
  const payWithPaystack = () => {
    if (cart.length === 0) return;

    // @ts-ignore - Paystack is loaded via script tag
    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_PUBLIC_KEY, // Replace with your live public key
      email: 'customer@email.com', // In production, collect customer email
      amount: cartTotal * 100, // Paystack uses kobo (multiply by 100)
      currency: 'NGN',
      ref: 'TLZ_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
      metadata: {
        custom_fields: [
          {
            display_name: 'Store',
            variable_name: 'store',
            value: 'Techlaza'
          },
          {
            display_name: 'Items',
            variable_name: 'items',
            value: cart.map(i => `${i.name} x${i.quantity}`).join(', ')
          }
        ]
      },
      callback: function(response: any) {
        // Payment successful
        alert(`Payment successful! Reference: ${response.reference}\n\nThank you for shopping with Techlaza!`);
        clearCart();
        setIsCartOpen(false);
      },
      onClose: function() {
        // User closed the popup
      }
    });

    if (handler) {
      handler.openIframe();
    } else {
      alert('Payment system not available. Please try WhatsApp or Bank Transfer.');
    }
  };

  // Option B: Bank Transfer - Opens modal with bank details
  const showBankTransfer = () => {
    setIsBankModalOpen(true);
  };

  // Option C: Order via WhatsApp
  const orderViaWhatsApp = () => {
    if (cart.length === 0) return;

    let message = '🛒 *NEW ORDER - TECHLAZA*\n\n';
    message += '━━━━━━━━━━━━━━━━━━\n';
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   Qty: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    message += '━━━━━━━━━━━━━━━━━━\n';
    message += `💰 *TOTAL: ${formatPrice(cartTotal)}*\n\n`;
    message += '📦 Please confirm availability and delivery details.\n';
    message += 'Thank you! 🙏';

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen relative">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] fade-in">
          <div className="glass-card px-5 py-3 flex items-center gap-3 glow-cyan">
            <i className="fas fa-check-circle text-cyan-400"></i>
            <span className="text-sm font-medium">{notification}</span>
          </div>
        </div>
      )}

      {/* ============ NAVIGATION ============ */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="text-2xl md:text-3xl font-bold gradient-text tracking-tight">
            <i className="fas fa-bolt mr-2"></i>Techlaza
          </a>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" onClick={() => setActiveSection('home')}
              className={`text-sm font-medium transition-colors hover:text-cyan-400 ${activeSection === 'home' ? 'text-cyan-400' : 'text-slate-300'}`}>
              Home
            </a>
            <a href="#products" onClick={() => setActiveSection('products')}
              className={`text-sm font-medium transition-colors hover:text-cyan-400 ${activeSection === 'products' ? 'text-cyan-400' : 'text-slate-300'}`}>
              Products
            </a>
            <a href="#about" onClick={() => setActiveSection('about')}
              className={`text-sm font-medium transition-colors hover:text-cyan-400 ${activeSection === 'about' ? 'text-cyan-400' : 'text-slate-300'}`}>
              About
            </a>
            <a href="#contact" onClick={() => setActiveSection('contact')}
              className={`text-sm font-medium transition-colors hover:text-cyan-400 ${activeSection === 'contact' ? 'text-cyan-400' : 'text-slate-300'}`}>
              Contact
            </a>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:bg-cyan-500/5"
          >
            <i className="fas fa-shopping-cart text-lg text-slate-200"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold badge-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section id="home" className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
        {/* Background Orbs */}
        <div className="hero-orb w-96 h-96 bg-cyan-500/20 -top-20 -left-20" style={{ animationDelay: '0s' }}></div>
        <div className="hero-orb w-80 h-80 bg-blue-500/20 top-1/3 -right-20" style={{ animationDelay: '2s' }}></div>
        <div className="hero-orb w-64 h-64 bg-purple-500/15 bottom-20 left-1/4" style={{ animationDelay: '4s' }}></div>

        <div className="text-center max-w-4xl mx-auto relative z-10 slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-medium text-cyan-300">Nigeria's #1 Gadget Store</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Future Tech</span>
            <br />
            <span className="gradient-text">In Your Hands.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium gadgets delivered fast across Nigeria. Secure payments, 
            authentic products, and unbeatable prices. From iPhones to PlayStations — 
            we've got your tech covered.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#products" className="btn-gradient text-base flex items-center gap-2">
              <i className="fas fa-shopping-bag"></i>
              Shop Now
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Techlaza! I\'m interested in your products.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-base flex items-center gap-2"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <i className="fas fa-shield-halved text-cyan-500"></i> Secure Payments
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-truck-fast text-cyan-500"></i> Fast Delivery
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-certificate text-cyan-500"></i> 100% Authentic
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-headset text-cyan-500"></i> 24/7 Support
            </span>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTS SECTION ============ */}
      <section id="products" className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Our <span className="gradient-text">Products</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Handpicked premium gadgets at the best prices in Nigeria
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {PRODUCTS.map((product, index) => (
              <div
                key={product.id}
                className="glass-card p-5 flex flex-col fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Image */}
                <div className="product-img-container w-full h-48 mb-4 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                  />
                </div>

                {/* Category Tag */}
                <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full self-start mb-3">
                  {product.category}
                </span>

                {/* Product Info */}
                <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                <p className="text-sm text-slate-400 mb-4 flex-grow">{product.description}</p>

                {/* Price & Button */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                  <span className="text-xl font-bold gradient-text">{formatPrice(product.price)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn-gradient text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section id="about" className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why <span className="gradient-text">Techlaza?</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
              We're not just another gadget store. Techlaza is built for the modern Nigerian 
              who demands quality, speed, and trust. Every product is sourced directly from 
              authorized distributors, ensuring 100% authenticity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bolt text-2xl text-cyan-400"></i>
                </div>
                <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
                <p className="text-slate-400 text-sm">Same-day dispatch in Lagos. 2-3 days nationwide delivery.</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-lock text-2xl text-blue-400"></i>
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Payments</h3>
                <p className="text-slate-400 text-sm">Paystack protected. Bank transfer or WhatsApp ordering available.</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-headset text-2xl text-purple-400"></i>
                </div>
                <h3 className="text-white font-semibold mb-2">Human Support</h3>
                <p className="text-slate-400 text-sm">Real humans on WhatsApp. No bots, no waiting. Instant replies.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT SECTION ============ */}
      <section id="contact" className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get In <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Have questions? We're just a message away.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 flex flex-col items-center gap-3 hover:border-green-500/40"
            >
              <i className="fab fa-whatsapp text-3xl text-green-400"></i>
              <span className="text-white font-medium">WhatsApp</span>
              <span className="text-slate-400 text-sm">Chat with us now</span>
            </a>
            <a
              href="mailto:hello@techlaza.ng"
              className="glass-card p-6 flex flex-col items-center gap-3 hover:border-cyan-500/40"
            >
              <i className="fas fa-envelope text-3xl text-cyan-400"></i>
              <span className="text-white font-medium">Email</span>
              <span className="text-slate-400 text-sm">hello@techlaza.ng</span>
            </a>
            <a
              href="tel:+2348012345678"
              className="glass-card p-6 flex flex-col items-center gap-3 hover:border-purple-500/40"
            >
              <i className="fas fa-phone text-3xl text-purple-400"></i>
              <span className="text-white font-medium">Call Us</span>
              <span className="text-slate-400 text-sm">+234 801 234 5678</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-800 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xl font-bold gradient-text">
              <i className="fas fa-bolt mr-2"></i>Techlaza
            </span>
            <p className="text-slate-500 text-sm mt-2">
              © {new Date().getFullYear()} Techlaza. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
              <i className="fab fa-tiktok"></i>
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-green-400 hover:border-green-500/50 transition-all">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>

          <p className="text-slate-600 text-xs">
            Built by <span className="text-cyan-500">Vector Codes</span> ⚡
          </p>
        </div>
      </footer>

      {/* ============ CART SLIDE-OUT ============ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Overlay */}
          <div
            className="modal-overlay absolute inset-0"
            onClick={() => setIsCartOpen(false)}
          ></div>

          {/* Cart Panel */}
          <div className="glass-modal relative w-full max-w-md h-full overflow-y-auto cart-slide-in p-6 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <i className="fas fa-shopping-cart text-cyan-400"></i>
                Your Cart
                {cartCount > 0 && (
                  <span className="text-sm font-normal text-slate-400">({cartCount} items)</span>
                )}
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  <i className="fas fa-cart-shopping text-3xl text-slate-600"></i>
                </div>
                <p className="text-slate-400 text-lg">Your cart is empty</p>
                <p className="text-slate-500 text-sm mt-2">Browse our products and add items</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="btn-outline mt-6"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="glass-card p-4 flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-cyan-400 font-semibold text-sm mt-1">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-md border border-slate-600 flex items-center justify-center text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all text-xs"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="text-white font-medium text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-md border border-slate-600 flex items-center justify-center text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all text-xs"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                        <span className="text-white font-semibold text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Total */}
                <div className="border-t border-slate-700/50 pt-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Delivery</span>
                    <span className="text-green-400 font-medium">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-3">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-2xl font-bold gradient-text">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {/* Checkout Buttons */}
                <div className="space-y-3">
                  {/* Pay with Card - Paystack */}
                  <button
                    onClick={payWithPaystack}
                    className="btn-gradient w-full flex items-center justify-center gap-3 py-4"
                  >
                    <i className="fas fa-credit-card"></i>
                    Pay with Card (Paystack)
                  </button>

                  {/* Bank Transfer */}
                  <button
                    onClick={showBankTransfer}
                    className="w-full py-4 rounded-xl border-2 border-blue-500/30 text-blue-400 font-semibold hover:bg-blue-500/10 hover:border-blue-500/50 transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-building-columns"></i>
                    Bank Transfer
                  </button>

                  {/* Order via WhatsApp */}
                  <button
                    onClick={orderViaWhatsApp}
                    className="btn-whatsapp w-full flex items-center justify-center gap-3 py-4"
                  >
                    <i className="fab fa-whatsapp text-xl"></i>
                    Order via WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============ BANK TRANSFER MODAL ============ */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="modal-overlay absolute inset-0"
            onClick={() => setIsBankModalOpen(false)}
          ></div>
          <div className="glass-modal relative w-full max-w-md p-8 slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-building-columns text-blue-400"></i>
                Bank Transfer
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Total */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-slate-400 text-sm mb-1">Amount to pay</p>
              <p className="text-3xl font-bold gradient-text">{formatPrice(cartTotal)}</p>
            </div>

            {/* Bank Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Bank</span>
                <span className="text-white font-semibold">OPay / Moniepoint</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Account Number</span>
                <span className="text-white font-semibold font-mono">8012345678</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Account Name</span>
                <span className="text-white font-semibold">Techlaza Enterprises</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-6">
              <p className="text-cyan-300 text-sm font-medium mb-2">
                <i className="fas fa-info-circle mr-2"></i>Instructions:
              </p>
              <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                <li>Transfer the exact amount to the account above</li>
                <li>Take a screenshot of the transaction receipt</li>
                <li>Send the proof of payment via WhatsApp</li>
                <li>Your order will be processed within 30 minutes</li>
              </ol>
            </div>

            {/* Send Proof via WhatsApp */}
            <button
              onClick={() => {
                const msg = `Hi Techlaza! I've made a bank transfer of ${formatPrice(cartTotal)} for my order. Here are the details:\n\n${cart.map(i => `• ${i.name} x${i.quantity}`).join('\n')}\n\nPlease find the payment receipt attached. Thank you!`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
                setIsBankModalOpen(false);
              }}
              className="btn-whatsapp w-full flex items-center justify-center gap-3 py-4"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Send Payment Proof via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TYPE DEFINITIONS
// ============================================
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Extend Window for Paystack
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: any) => any;
    };
  }
}

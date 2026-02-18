document.addEventListener('DOMContentLoaded', () => {

    const yearSpan = document.getElementById('year');
    if(yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.getElementById('navbar-default');
    const navLinks = document.querySelectorAll('.nav-link');

    if(menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            navbar.classList.toggle('hidden');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!navbar.classList.contains('hidden')) {
                    navbar.classList.add('hidden');
                }
            });
        });
    }

    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('shadow-lg');
        } else {
            nav.classList.remove('shadow-lg');
        }
    });

    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeModalBtn = document.getElementById('close-modal');
    const modalCaption = document.getElementById('modal-caption');
    const zoomableImages = document.querySelectorAll('.img-zoom');

    const openModal = (src, alt) => {
        modalImg.src = src;
        modalImg.alt = alt || 'Projeto';

        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');

        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalImg.classList.remove('scale-95');
            modalImg.classList.add('scale-100');
            if(modalCaption) modalCaption.classList.remove('opacity-0');
        }, 10);
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modalImg.classList.remove('scale-100');
        modalImg.classList.add('scale-95');
        if(modalCaption) modalCaption.classList.add('opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            modalImg.src = '';
        }, 300);
    };

    zoomableImages.forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(img.src, img.alt);
        });
    });

    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'modal-content') {
                closeModal();
            }
        });
    }

    // Fechar com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
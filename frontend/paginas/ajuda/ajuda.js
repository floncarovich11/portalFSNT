// Funcionalidade de accordion para os cards de ajuda
document.querySelectorAll('.ajuda-header').forEach(header => {
    header.addEventListener('click', function() {
        const card = this.parentElement;
        const content = card.querySelector('.ajuda-content');
        const isActive = card.classList.contains('active');
        
        // Fecha todos os outros cards
        document.querySelectorAll('.ajuda-card').forEach(c => {
            c.classList.remove('active');
            c.querySelector('.ajuda-content').style.maxHeight = null;
        });
        
        // Abre ou fecha o card clicado
        if (!isActive) {
            card.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
        }
    });
});
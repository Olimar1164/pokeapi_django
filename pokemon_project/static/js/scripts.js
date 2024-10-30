document.addEventListener('DOMContentLoaded', function() {
    console.log('JavaScript cargado correctamente.');

    const loadMoreButton = document.getElementById('load-more');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', function() {
            const nextPage = loadMoreButton.getAttribute('data-next-page');
            fetch(`?page=${nextPage}`)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newPokemons = doc.querySelectorAll('#pokemon-list .col-md-3');
                    const pokemonList = document.getElementById('pokemon-list');
                    newPokemons.forEach(pokemon => {
                        pokemonList.appendChild(pokemon);
                    });
                    const newNextPage = doc.querySelector('#load-more').getAttribute('data-next-page');
                    if (newNextPage) {
                        loadMoreButton.setAttribute('data-next-page', newNextPage);
                    } else {
                        loadMoreButton.remove();
                    }
                    // Scroll down smoothly to give a natural effect
                    window.scrollBy({
                        top: 600,
                        behavior: 'smooth'
                    });
                })
                .catch(error => console.error('Error al cargar más Pokémon:', error));
        });
    }

    const randomPokemonButton = document.getElementById('random-pokemon');
    if (randomPokemonButton) {
        randomPokemonButton.addEventListener('click', function() {
            const randomId = Math.floor(Math.random() * 898) + 1; // Assuming there are 898 Pokémon
            fetch(`/pokemon/${randomId}/`)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const pokemonDetail = doc.querySelector('.pokemon-detail-container');
                    const modal = $('#pokemonModal');
                    modal.find('.modal-body').html(pokemonDetail.innerHTML);
                    modal.modal('show');
                })
                .catch(error => console.error('Error al cargar los detalles del Pokémon:', error));
        });
    }

    const surpriseMeButton = document.getElementById('surprise-me');
    if (surpriseMeButton) {
        surpriseMeButton.addEventListener('click', function() {
            const pokemonList = document.getElementById('pokemon-list');
            pokemonList.innerHTML = ''; // Limpiar la lista actual
            const promises = [];
            for (let i = 0; i < 8; i++) {
                const randomId = Math.floor(Math.random() * 898) + 1; // Assuming there are 898 Pokémon
                promises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}/`).then(response => response.json()));
            }
            Promise.all(promises)
                .then(pokemons => {
                    pokemons.forEach(pokemon => {
                        const pokemonCard = document.createElement('div');
                        pokemonCard.classList.add('col-md-3', 'col-sm-6');
                        pokemonCard.innerHTML = `
                            <div class="card mb-4 shadow-sm pokemon-card" data-toggle="modal" data-target="#pokemonModal" data-id="${pokemon.id}">
                                <img src="${pokemon.sprites.front_default}" class="card-img-top" alt="${pokemon.name}">
                                <div class="pokemon-card-info">
                                    <h5 class="card-title">${pokemon.name}</h5>
                                    <p class="pokemon-id">N.º ${pokemon.id.toString().padStart(3, '0')}</p>
                                    <p class="card-text">
                                        ${pokemon.types.map(type => `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`).join(' ')}
                                    </p>
                                </div>
                            </div>
                        `;
                        pokemonList.appendChild(pokemonCard);
                    });
                })
                .catch(error => console.error('Error al cargar los Pokémon:', error));
        });
    }

    $('#pokemonModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const pokemonId = button.data('id');
        const modal = $(this);
        fetch(`/pokemon/${pokemonId}/`)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const pokemonDetail = doc.querySelector('.pokemon-detail-container');
                modal.find('.modal-body').html(pokemonDetail.innerHTML);
            })
            .catch(error => console.error('Error al cargar los detalles del Pokémon:', error));
    });

    window.onpopstate = function(event) {
        if (event.state && event.state.modal) {
            $('#pokemonModal').modal('show');
        } else {
            $('#pokemonModal').modal('hide');
        }
    };

    $('#pokemonModal').on('shown.bs.modal', function () {
        history.pushState({ modal: true }, null, null);
    });

    $('#pokemonModal').on('hidden.bs.modal', function () {
        if (history.state && history.state.modal) {
            history.replaceState(null, null, window.location.pathname);
        }
    });

    // Redirigir al inicio al hacer clic en el logo de Pokémon
    const pokemonLogo = document.querySelector('.pokemon-logo');
    if (pokemonLogo) {
        pokemonLogo.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // Cambiar la búsqueda para que se realice a través de un modal
    const searchForm = document.querySelector('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const query = searchForm.querySelector('input[name="query"]').value;
            fetch(`/pokemon/search/?query=${query}`)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const pokemonDetail = doc.querySelector('.pokemon-detail-container');
                    const modal = $('#pokemonModal');
                    modal.find('.modal-body').html(pokemonDetail.innerHTML);
                    modal.modal('show');
                })
                .catch(error => console.error('Error al buscar el Pokémon:', error));
        });
    }
});
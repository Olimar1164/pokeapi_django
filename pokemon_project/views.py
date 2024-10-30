import aiohttp
import asyncio
import requests
from django.views.generic import TemplateView
from django.core.cache import cache
from django.shortcuts import redirect

class PokemonListView(TemplateView):
    template_name = 'pokemon_project/pokemon_list.html'

    async def fetch_pokemon_detail(self, session, url):
        async with session.get(url) as response:
            return await response.json()

    async def get_pokemon_details(self, pokemons):
        async with aiohttp.ClientSession() as session:
            tasks = []
            for pokemon in pokemons:
                tasks.append(self.fetch_pokemon_detail(session, pokemon['url']))
            return await asyncio.gather(*tasks)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        page = int(self.request.GET.get('page', 1))
        limit = 8  # Limitar a 8 tarjetas por página
        offset = (page - 1) * limit

        # Intentar obtener los datos de la caché
        cache_key = f'pokemon_list_{offset}_{limit}'
        data = cache.get(cache_key)

        if not data:
            response = requests.get(f'https://pokeapi.co/api/v2/pokemon?offset={offset}&limit={limit}')
            data = response.json()
            # Almacenar los datos en la caché
            cache.set(cache_key, data, timeout=60*15)  # Cachear por 15 minutos

        pokemons = data.get('results', [])

        # Obtener detalles de cada Pokémon para la imagen y tipos
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        pokemon_details = loop.run_until_complete(self.get_pokemon_details(pokemons))

        for i, pokemon in enumerate(pokemons):
            pokemon['id'] = pokemon_details[i]['id']
            pokemon['image_url'] = pokemon_details[i]['sprites']['front_default']
            pokemon['types'] = [t['type']['name'] for t in pokemon_details[i]['types']]

        context['pokemons'] = pokemons
        context['next'] = data.get('next')
        context['previous'] = data.get('previous')
        context['current_page'] = page
        return context

class PokemonDetailView(TemplateView):
    template_name = 'pokemon_project/pokemon_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        pokemon_id = self.kwargs.get('id')
        response = requests.get(f'https://pokeapi.co/api/v2/pokemon/{pokemon_id}')
        pokemon_data = response.json()
        context['pokemon'] = pokemon_data
        context['image_url'] = pokemon_data['sprites']['front_default']
        context['types'] = [t['type']['name'] for t in pokemon_data['types']]
        context['abilities'] = [a['ability']['name'] for a in pokemon_data['abilities']]
        return context

class PokemonSearchView(TemplateView):
    template_name = 'pokemon_project/pokemon_list.html'

    def get(self, request, *args, **kwargs):
        query = request.GET.get('query')
        if query:
            try:
                # Try to get Pokémon by ID
                response = requests.get(f'https://pokeapi.co/api/v2/pokemon/{int(query)}')
            except ValueError:
                # If not an ID, try to get Pokémon by name
                response = requests.get(f'https://pokeapi.co/api/v2/pokemon/{query.lower()}')
            if response.status_code == 200:
                pokemon = response.json()
                return redirect('pokemon-detail', id=pokemon['id'])
        return super().get(request, *args, **kwargs)
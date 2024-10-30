from django.urls import path
from pokemon_project import views

urlpatterns = [
    path('', views.PokemonListView.as_view(), name='pokemon-list'),
    path('<int:id>/', views.PokemonDetailView.as_view(), name='pokemon-detail'),
    path('search/', views.PokemonSearchView.as_view(), name='pokemon-search'),
]
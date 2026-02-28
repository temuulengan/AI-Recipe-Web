import React, { useState } from "react";
import "./Recipes.css";

function Recipes() {
  // Mock recipe data 
  const mockRecipes = [
    {
      id: 1,
      title: "Spaghetti Carbonara",
      image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&q=80",
      ingredients: ["spaghetti", "egg", "bacon", "parmesan"],
      time: "25 min",
    },
    {
      id: 2,
      title: "Avocado Toast",
      image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&q=80",
      ingredients: ["avocado", "bread", "olive oil", "lemon"],
      time: "10 min",
    },
    {
      id: 3,
      title: "Chicken Teriyaki Bowl",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
      ingredients: ["chicken", "rice", "soy sauce", "broccoli"],
      time: "30 min",
    },
    {
      id: 4,
      title: "Beef Tacos",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80",
      ingredients: ["beef", "tortilla", "cheese", "lettuce"],
      time: "20 min",
    },
    {
      id: 5,
      title: "Caesar Salad",
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&q=80",
      ingredients: ["lettuce", "croutons", "chicken", "parmesan"],
      time: "15 min",
    },
  ]; 
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecipes = mockRecipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some((ing) =>
        ing.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="recipes-container">
      <h1 className="recipes-title">Discover Delicious Recipes</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by recipe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="recipes-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="recipe-image"
              />
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p>
                  <strong>Ingredients:</strong>{" "}
                  {recipe.ingredients.join(", ")}
                </p>
                <p className="time">{recipe.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No recipes found</p>
        )}
      </div>
    </div>
  );
}

export default Recipes;
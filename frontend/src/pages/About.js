import React from 'react';
import './About.css';

function About() {
    return (
        <div className="about-container">
            <div className="about-content">
                <h1>About Flavor Finder</h1>

                <section className="about-section">
                    <h2>Project Overview</h2>
                    <p>
                        This is a team project developed by <strong>Seoul National University of Science and Technology (SeoulTech)
                            Advanced Web Programming Team 6</strong> as part of our coursework.
                    </p>
                </section>

                <section className="about-section">
                    <h2>Team Members</h2>
                    <ul className="team-list">
                        <li>서준수 (Seo Junsu)</li>
                        <li>허세민 (Heo Semin)</li>
                        <li>최건희 (Choi Gunhee)</li>
                        <li>테무렌 (Temuulen)</li>
                    </ul>
                </section>

                <section className="about-section">
                    <h2>Features</h2>
                    <p>
                        Flavor Finder is a recipe discovery platform that helps users find and share delicious recipes.
                        Our platform includes:
                    </p>
                    <ul className="features-list">
                        <li>Browse and search recipes</li>
                        <li>Community board for sharing recipes and tips</li>
                        <li><strong>AI Recipe Generator</strong> - Create personalized recipes using AI</li>
                        <li>User profiles and favorites</li>
                    </ul>
                    <p className="login-note">
                        <strong>Note:</strong> To use the <strong>AI Recipe</strong> feature, you must be logged in to your account.
                    </p>
                </section>

                <section className="about-section">
                    <h2>Technology Stack</h2>
                    <p>
                        This project leverages modern web technologies including React for the frontend,
                        NestJS and Flask for the backend, and PostgreSQL for data management.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;

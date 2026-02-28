import React from 'react';
import './Contact.css';
import { FaEnvelope, FaMapMarkerAlt, FaGithub } from 'react-icons/fa';

function Contact() {
    return (
        <div className="contact-container">
            <div className="contact-content">
                <h1>Contact Us</h1>
                <p className="contact-intro">
                    We'd love to hear from you! Feel free to reach out to us with any questions or feedback.
                </p>

                <div className="contact-info-grid">
                    <div className="contact-card">
                        <div className="contact-icon">
                            <FaEnvelope />
                        </div>
                        <h3>Email</h3>
                        <p>
                            <a href="mailto:seoultechawp@gmail.com">seoultechawp@gmail.com</a>
                        </p>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <FaMapMarkerAlt />
                        </div>
                        <h3>Address</h3>
                        <p>
                            서울과학기술대학교 미래관<br />
                            Seoul National University of Science and Technology<br />
                            Mirae Hall
                        </p>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <FaGithub />
                        </div>
                        <h3>GitHub</h3>
                        <p>
                            <a
                                href="https://github.com/AdvancedWebProgramming-6"
                                target="_blank"
                                rel="noreferrer"
                            >
                                AdvancedWebProgramming-6
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;

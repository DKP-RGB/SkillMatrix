import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-[#0d1117] border-t border-glass-border py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-secondary">
                <div className="mb-4 md:mb-0">
                    <span className="font-heading font-bold text-white text-lg mr-2">SkillMatrix</span>
                    © {new Date().getFullYear()} All rights reserved.
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-accent-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-accent-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-accent-primary transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

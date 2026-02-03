
import React from 'react';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const WhoWeAre: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="bg-slate-900 py-20 md:py-32 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 shadow-sm mb-6 animate-fade-in-down">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Institutional Profile</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
            Who We Are
          </h1>
          <div className="w-24 h-2 bg-emerald-500 mx-auto mt-8 rounded-full"></div>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="py-20 md:py-32 bg-white relative">
        <div className="max-w-4xl mx-auto px-6 md:px-4">
          
          {/* Founders Note / Mission */}
          <div className="prose prose-slate prose-lg max-w-none space-y-12 animate-fade-in">
            
            <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed border-l-8 border-[#002868] pl-8">
              Brazilian Clean was founded by Wagner Gois with a clear and purposeful mission: 
              to connect American clients with exceptional Brazilian house cleaning professionals through a platform built on trust, respect, and integrity.
            </p>

            <p className="text-slate-600 leading-relaxed">
              We understand that a home is more than just a physical space. A clean, organized, and comfortable home creates peace, stability, and well-being for families. At Brazilian Clean, we believe that these elements are fundamental to a happier, healthier society.
            </p>

            <p className="text-slate-600 leading-relaxed">
              Our platform was carefully developed to bring together two worlds: 
              American clients who value quality, reliability, and professionalism, and Brazilian house cleaners who are widely recognized for their dedication, attention to detail, and strong work ethic. Brazilian cleaning professionals have earned a strong reputation across the United States for delivering outstanding results, and Brazilian Clean exists to honor, elevate, and organize that excellence.
            </p>

            <div className="bg-slate-50 p-10 md:p-16 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Our Values
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-[#002868] uppercase tracking-widest mb-2">Respect</h4>
                  <p className="text-slate-600">
                    Respect is at the core of everything we do. We respect our clients, their homes, and their expectations. 
                    We respect the professionals who provide these services, their work, and their dignity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-200">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ethics</h4>
                    <p className="text-sm text-slate-500 font-medium">Guide our decisions.</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Transparency</h4>
                    <p className="text-sm text-slate-500 font-medium">Shapes our relationships.</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Quality</h4>
                    <p className="text-sm text-slate-500 font-medium">Defines our standards.</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg font-medium text-slate-700 leading-relaxed text-center py-10">
              Brazilian Clean is not just a marketplace. <br/>
              <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                It is a trusted bridge between people — built to create confidence, deliver high-quality cleaning services, and ensure that every home feels truly cared for.
              </span>
            </p>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-16 text-center border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
           <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-[#009739] flex items-center justify-center font-black text-[#009739] text-[10px]">BR</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#002868] flex items-center justify-center font-black text-[#002868] text-[10px]">US</div>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-4">
             Brazilian Clean Professional Home Care
           </p>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
             Marketplace v{SYSTEM_IDENTITY.VERSION} • Established with Integrity
           </p>
        </div>
      </footer>
    </div>
  );
};

export default WhoWeAre;

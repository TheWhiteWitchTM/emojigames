class TrumpFaces {
  static faces = {
    happy: `
\x1b[33;1m   ██████████████   
\x1b[33;1m  ██\x1b[37m████████████\x1b[33;1m██  
\x1b[33;1m ██\x1b[37m██\x1b[33m██\x1b[37m████\x1b[33m██\x1b[37m██\x1b[33;1m██ 
\x1b[33;1m ██\x1b[37m██████████████\x1b[33;1m██ 
\x1b[33;1m  ██\x1b[37m██\x1b[31m████\x1b[37m██\x1b[33;1m██  
\x1b[33;1m   ██████████████   
\x1b[0m`,
    smug: `
\x1b[33;1m   ██████████████   
\x1b[33;1m  ██\x1b[37m████████████\x1b[33;1m██  
\x1b[33;1m ██\x1b[37m██\x1b[33m██\x1b[37m██\x1b[33m██\x1b[37m██\x1b[33;1m██ 
\x1b[33;1m ██\x1b[37m████\x1b[33m████\x1b[37m████\x1b[33;1m██ 
\x1b[33;1m  ██\x1b[37m██\x1b[31m████\x1b[37m██\x1b[33;1m██  
\x1b[33;1m   ██████████████   
\x1b[0m`,
    rant: `
\x1b[31;1m   ██████████████   
\x1b[31;1m  ██\x1b[37m████████████\x1b[31;1m██  
\x1b[31;1m ██\x1b[37m██\x1b[31m██\x1b[37m████\x1b[31m██\x1b[37m██\x1b[31;1m██ 
\x1b[31;1m ██\x1b[37m██████████████\x1b[31;1m██ 
\x1b[31;1m  ██\x1b[37m██\x1b[33m████\x1b[37m██\x1b[31;1m██  
\x1b[31;1m   ██████████████   
\x1b[0m`,
    neutral: `
\x1b[37m   ██████████████   
\x1b[37m  ██\x1b[33;1m████████████\x1b[37m██  
\x1b[37m ██\x1b[33;1m██\x1b[37m██\x1b[33;1m████\x1b[37m██\x1b[33;1m██\x1b[37m██ 
\x1b[37m ██\x1b[33;1m██████████████\x1b[37m██ 
\x1b[37m  ██\x1b[33;1m██\x1b[31m████\x1b[33;1m██\x1b[37m██  
\x1b[37m   ██████████████   
\x1b[0m`,
    winning: `
\x1b[32;1m   ██████████████   
\x1b[32;1m  ██\x1b[37m████████████\x1b[32;1m██  
\x1b[32;1m ██\x1b[37m██\x1b[32m██\x1b[37m████\x1b[32m██\x1b[37m██\x1b[32;1m██ 
\x1b[32;1m ██\x1b[37m██████████████\x1b[32;1m██ 
\x1b[32;1m  ██\x1b[37m██\x1b[33m████\x1b[37m██\x1b[32;1m██  
\x1b[32;1m   ██████████████   
\x1b[0m`
  };

  static draw(term, mood = "neutral") {
    term.clear();
    term.moveTo(0, 0);
    term.writeAnsi(this.faces[mood] || this.faces.neutral);
    term.writeln("");
    term.writeln("");
  }
}
window.TrumpFaces = TrumpFaces;

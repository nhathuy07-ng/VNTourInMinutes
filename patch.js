const fs = require('fs');
let code = fs.readFileSync('app/api/search_events/route.ts', 'utf8');
code = code.replace(
`    let timeConstraint = "upcoming";
    let minDateTs = 0;
    if (monthFrom || monthTo) {
      const fromStr = monthFrom ? \`from \${monthFrom}\` : "";
      const toStr = monthTo ? \`to \${monthTo}\` : "";
      timeConstraint = \`happening \${fromStr} \${toStr}\`.trim();
    }`,
`    let timeConstraint = "upcoming";
    let minDateTs = 0;
    if (monthFrom || monthTo) {
      const fromStr = monthFrom ? \`from \${monthFrom}\` : "";
      const toStr = monthTo ? \`to \${monthTo}\` : "";
      timeConstraint = \`happening \${fromStr} \${toStr}\`.trim();
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      minDateTs = tomorrow.getTime();
      timeConstraint = \`happening from \${tomorrow.toISOString().split('T')[0]} onwards\`;
    }`
);

code = code.replace(
`    let events = [];
    try {
      events = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse events JSON", e);
    }`,
`    let events = [];
    try {
      let parsedEvents = JSON.parse(jsonText);
      if (Array.isArray(parsedEvents)) {
        if (minDateTs > 0) {
          events = parsedEvents.map((evt: any) => {
             if (evt.participations && Array.isArray(evt.participations)) {
               evt.participations = evt.participations.filter((p: any) => p.date >= minDateTs);
             }
             return evt;
          }).filter((evt: any) => evt.participations && evt.participations.length > 0);
        } else {
          events = parsedEvents;
        }
      }
    } catch (e) {
      console.error("Failed to parse events JSON", e);
    }`
);
fs.writeFileSync('app/api/search_events/route.ts', code);

// Content sourced from Workflow_1.odt. Each workflow corresponds to one of
// the three starting-point buttons on /process.
const workflows = [
  {
    slug: 'plans',
    buttonLabel: 'With architectural plans',
    title: 'Starting from architectural plans',
    images: ['/process/wf1-01.jpeg', '/process/wf1-02.jpeg', '/process/wf1-03.jpeg'],
    steps: [
      {
        title: 'Project Intake & Scoping',
        points: [
          'Establish style, target audience, number of views/animations, deadlines, budget.',
          'Define project scope and deliverables (number of revision rounds etc.).',
          'Quote + agreement.',
        ],
      },
      {
        title: 'Asset Preparation & Base Model',
        points: [
          'Clean and organize incoming files (CAD, PDF, DWG, Revit, etc.).',
          'Import into 3D software and build accurate massing / detailed model from plans.',
          'Model missing elements (furniture, landscaping, site environment).',
        ],
      },
      {
        title: 'Material & Look Development',
        points: [
          'Assign materials based on plans/spec sheets or client mood references.',
          'Create material library.',
          'Client review of material samples.',
        ],
      },
      {
        title: 'Lighting & Camera Setup',
        points: [
          'Set up exterior/interior lighting.',
          'Place cameras according to client-requested views or best storytelling angles.',
          'Composition check (rule of thirds, leading lines, scale figures).',
        ],
      },
      {
        title: 'Rendering & Iteration',
        points: [
          'Produce low-res test renders → client feedback.',
          'Apply revisions (geometry, materials, lighting, cameras).',
          'Final high-res renders / animation.',
        ],
      },
      {
        title: 'Post-Production',
        points: [
          'Color grading, sky replacement, people/vegetation population, atmospheric effects (Photoshop, After Effects, AI tools).',
          'Final stills / video editing / sound design (if animation).',
        ],
      },
      {
        title: 'Delivery & Handover',
        points: [
          'Deliver files in agreed formats + source files if agreed upon.',
          'Client final approval.',
          'Sign-off.',
        ],
      },
    ],
  },
  {
    slug: 'references',
    buttonLabel: 'With reference images',
    title: 'Starting from reference images',
    images: ['/process/wf2-01.jpeg', '/process/wf2-02.jpeg', '/process/wf2-03.jpeg'],
    steps: [
      {
        title: 'Project Intake & Interpretation',
        points: [
          'Analyze photos, moodboards, sketches and written brief.',
          'Define scope (how much creative freedom, number of final images/animations).',
          'Quote + agreement.',
        ],
      },
      {
        title: 'Concept & Design Development',
        points: [
          'Create initial massing studies or rough block-outs that match the spirit of the references.',
          'Produce quick concept sketches or simple 3D massing + lighting tests.',
          'Client review of concept direction.',
        ],
      },
      {
        title: 'Detailed Modeling',
        points: [
          'Build the architecture from the approved concept.',
          'Match proportions, details, and language to references where required.',
          'Add context, landscaping, and interior fit-out.',
        ],
      },
      {
        title: 'Material, Lighting & Atmosphere Matching',
        points: [
          'Recreate materials and lighting from references.',
          'Develop atmosphere (time of day, weather, season) that matches the moodboards.',
          'Model + material review with client.',
        ],
      },
      {
        title: 'Camera & Composition',
        points: [
          'Compose shots that echo the strongest reference images while serving the new design.',
          'Test multiple angles; select hero views.',
          'Composition check.',
        ],
      },
      {
        title: 'Rendering & Iteration',
        points: [
          'Produce low-res test renders → client feedback.',
          'Apply revisions (geometry, materials, lighting, cameras).',
          'Final high-res renders / animation.',
        ],
      },
      {
        title: 'Post-Production',
        points: [
          'Color grading, sky replacement, people/vegetation population, atmospheric effects (Photoshop, After Effects, AI tools).',
          'Final stills / video editing / sound design (if animation).',
        ],
      },
      {
        title: 'Delivery & Handover',
        points: [
          'Deliver files in agreed formats + source files if agreed upon.',
          'Client final approval.',
          'Sign-off.',
        ],
      },
    ],
  },
  {
    slug: 'idea',
    buttonLabel: 'With an idea',
    title: 'Starting from an idea',
    images: ['/process/wf3-01.jpeg', '/process/wf3-02.jpeg', '/process/wf3-03.jpeg'],
    steps: [
      {
        title: 'Project Discovery & Scoping',
        points: [
          'In-depth discussion or questionnaire (target users, site constraints, style keywords, budget range, emotional goals).',
          'Translate the ideas into a clear design brief and scope outline.',
          'Quote + agreement.',
        ],
      },
      {
        title: 'Concept Design Phase',
        points: [
          'Produce multiple concept options (sketches, massing models, collages, simple 3D massing).',
          'Present 2–3 directions with mood, volume, and basic material ideas.',
          'Client review of concept direction.',
        ],
      },
      {
        title: 'Schematic Design / Design Development',
        points: [
          'Develop the chosen concept into more resolved architecture (plans, elevations, 3D model).',
          'Iterate with client until the design is locked.',
          'Produce schematic drawings if needed for later construction (optional).',
        ],
      },
      {
        title: 'Detailed Modeling & Look Development',
        points: [
          'Fully model the approved design.',
          'Develop materials, interiors, landscaping, and context.',
          'Lighting and camera setup.',
        ],
      },
      {
        title: 'Visualization Production',
        points: [
          'Test renders → client feedback.',
          'Revisions until design + visualization are approved.',
          'Final high-quality renders / animations.',
        ],
      },
      {
        title: 'Post-Production & Presentation Assets',
        points: [
          'Color grading, sky replacement, people/vegetation population, atmospheric effects (Photoshop, After Effects, AI tools).',
          'Final stills / video editing / sound design (if animation).',
        ],
      },
      {
        title: 'Delivery & Handover',
        points: [
          'Deliver files in agreed formats + source files if agreed upon.',
          'Client final approval.',
          'Sign-off.',
        ],
      },
    ],
  },
];

export default workflows;

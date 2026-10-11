import { GradeLevel } from '../types/simulation';

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicTitle: string;
  gradeLevel: GradeLevel;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  badge: string;
}

export const COMPREHENSIVE_QUIZ_BANK: QuizQuestion[] = [
  // ==========================================
  // 1. CICLO DEL AGUA Y ESTADOS DE LA MATERIA
  // ==========================================
  {
    id: 'q_agua_1',
    topicId: 'ciclo-agua',
    topicTitle: 'El Ciclo del Agua',
    gradeLevel: '3-4',
    question: '¿Qué le ocurre al agua líquida del océano cuando el Sol la calienta con fuerza?',
    options: [
      'Se convierte en vapor de agua y asciende hacia el cielo (Evaporación)',
      'Se congela en el fondo formando bloques de hielo',
      'Desaparece para siempre de nuestro planeta',
      'Se transforma en rocas volcánicas sólidas',
    ],
    correctIndex: 0,
    hint: 'Piensa en lo que sale de una olla con agua hirviendo o en los charcos que se secan con el sol.',
    explanation: 'El calor del Sol entrega energía térmica a las moléculas de agua, haciendo que se separen y se eleven como gas invisible en el proceso de evaporación.',
    badge: 'Maestro de la Evaporación ☀️',
  },
  {
    id: 'q_agua_2',
    topicId: 'ciclo-agua',
    topicTitle: 'El Ciclo del Agua',
    gradeLevel: '3-4',
    question: '¿Por qué se forman las nubes cuando el vapor de agua sube a la alta atmósfera?',
    options: [
      'Porque arriba hace frío y el vapor se junta en gotitas minúsculas (Condensación)',
      'Porque hay máquinas de algodón de azúcar flotando en el cielo',
      'Porque las aves soplan el aire frío hacia arriba',
      'Porque el cielo está pintado de pintura blanca',
    ],
    correctIndex: 0,
    hint: 'Recuerda qué pasa con el vapor de tu aliento en una mañana fría de invierno.',
    explanation: 'A gran altura la temperatura es muy baja. El vapor pierde calor y se condensa en millones de gotas microscópicas que flotan juntas formando nubes.',
    badge: 'Explorador de Nubes ☁️',
  },
  {
    id: 'q_agua_3',
    topicId: 'ciclo-agua',
    topicTitle: 'El Ciclo del Agua',
    gradeLevel: '1-2',
    question: 'Si la temperatura en lo alto de la montaña baja a menos de 0°C, ¿en qué estado caerá el agua?',
    options: [
      'En estado sólido como nieve o granizo blanco',
      'En estado de lava ardiente',
      'En vapor de gas caliente',
      'En forma de jugo de naranja',
    ],
    correctIndex: 0,
    hint: 'A 0°C el agua líquida se congela.',
    explanation: 'El punto de congelación del agua es 0°C. Si el aire está más frío que eso, las gotas se cristalizan en copos de nieve o perlas de granizo sólido.',
    badge: 'Guardián del Hielo ❄️',
  },
  {
    id: 'q_agua_4',
    topicId: 'ciclo-agua',
    topicTitle: 'El Ciclo del Agua',
    gradeLevel: '5-6',
    question: '¿Cómo vuelve el agua de la lluvia que cae en las montañas de regreso al mar?',
    options: [
      'Fluye por arroyos, ríos y aguas subterráneas hacia el mar (Precipitación y Retorno)',
      'Se destruye por completo al tocar el suelo',
      'Se queda congelada para siempre en la cumbre',
      'Sube al espacio exterior en naves espaciales',
    ],
    correctIndex: 0,
    hint: 'El ciclo del agua nunca se detiene: es un circuito continuo y cerrado en la Tierra.',
    explanation: 'La gravedad atrae el agua hacia abajo: corre por las laderas formando arroyos y ríos que desembocan en el mar, donde el ciclo vuelve a comenzar.',
    badge: 'Hidrólogo Experto 🌊',
  },

  // ==========================================
  // 2. SISTEMA SOLAR Y ÓRBITAS
  // ==========================================
  {
    id: 'q_solar_1',
    topicId: 'sistema-solar',
    topicTitle: 'El Sistema Solar',
    gradeLevel: '3-4',
    question: '¿Qué cuerpo celeste se encuentra en el centro de nuestro sistema planetario?',
    options: [
      'El Sol, nuestra estrella gigante y luminosa',
      'La Tierra con sus continentes',
      'La Luna blanca',
      'Un cometa errante de hielo',
    ],
    correctIndex: 0,
    hint: 'Es la enorme bola de gas caliente que nos da luz y calor todos los días.',
    explanation: 'El Sol posee más del 99% de la masa total de todo el sistema solar y mantiene a todos los planetas girando en órbitas a su alrededor.',
    badge: 'Astrónomo Solar ☀️',
  },
  {
    id: 'q_solar_2',
    topicId: 'sistema-solar',
    topicTitle: 'El Sistema Solar',
    gradeLevel: '3-4',
    question: '¿Cuál es el planeta más cercano al Sol y el más rápido en completar su órbita?',
    options: [
      'Mercurio',
      'Júpiter',
      'Saturno',
      'Marte',
    ],
    correctIndex: 0,
    hint: 'Lleva el nombre del veloz mensajero alado de la mitología.',
    explanation: 'Mercurio es el planeta más próximo al Sol y tarda solo 88 días terrestres en completar una vuelta completa a su alrededor.',
    badge: 'Piloto Interplanetario 🚀',
  },
  {
    id: 'q_solar_3',
    topicId: 'sistema-solar',
    topicTitle: 'El Sistema Solar',
    gradeLevel: '5-6',
    question: '¿De qué están compuestos principalmente los impresionantes anillos de Saturno?',
    options: [
      'De miles de millones de fragmentos de hielo, roca y polvo espacial',
      'De láminas de metal dorado y pulido',
      'De nubes de humo espeso de volcanes espaciales',
      'De aros gigantes de plástico rígido',
    ],
    correctIndex: 0,
    hint: 'En el espacio frío, el agua congelada refleja la luz solar como miles de espejitos.',
    explanation: 'Los anillos de Saturno son partículas diminutas y fragmentos de hielo cósmico que orbitan velozmente en un plano muy delgado.',
    badge: 'Señor de los Anillos 🪐',
  },
  {
    id: 'q_solar_4',
    topicId: 'sistema-solar',
    topicTitle: 'El Sistema Solar',
    gradeLevel: '1-2',
    question: '¿Alrededor de qué cuerpo celeste gira la Luna cada mes?',
    options: [
      'Alrededor de nuestro planeta Tierra',
      'Alrededor del centro de la galaxia directamente',
      'Alrededor de las nubes del cielo',
      'Está fija e inmóvil en el espacio',
    ],
    correctIndex: 0,
    hint: 'La Luna es el único satélite natural de nuestro propio hogar cósmico.',
    explanation: 'La Luna orbita la Tierra en aproximadamente 28 días, mostrando diferentes fases (llena, menguante, nueva y creciente) según cómo la ilumine el Sol.',
    badge: 'Vigía Lunar 🌕',
  },

  // ==========================================
  // 3. FOTOSÍNTESIS Y VIDA VEGETAL
  // ==========================================
  {
    id: 'q_foto_1',
    topicId: 'fotosintesis',
    topicTitle: 'La Fotosíntesis',
    gradeLevel: '3-4',
    question: '¿Qué gas indispensable para la respiración de humanos y animales liberan las plantas verdes?',
    options: [
      'Oxígeno (O2)',
      'Dióxido de carbono (CO2)',
      'Humo negro contaminante',
      'Gas helio para globos',
    ],
    correctIndex: 0,
    hint: 'Es el aire puro que respiramos cuando paseamos por un bosque o parque.',
    explanation: 'Durante la fotosíntesis, las plantas usan agua, luz solar y dióxido de carbono para producir su alimento (glucosa) y liberan oxígeno limpio como fruto.',
    badge: 'Pulmón Verde 🍃',
  },
  {
    id: 'q_foto_2',
    topicId: 'fotosintesis',
    topicTitle: 'La Fotosíntesis',
    gradeLevel: '3-4',
    question: '¿Cómo se llama la sustancia verde en las hojas encargada de capturar la luz del Sol?',
    options: [
      'Clorofila',
      'Gelatina vegetal',
      'Barniz botánico',
      'Azúcar refinada',
    ],
    correctIndex: 0,
    hint: 'Su nombre empieza con "Cloro..." y se encuentra dentro de los cloroplastos.',
    explanation: 'La clorofila es el pigmento natural que absorbe las ondas de luz solar (especialmente azules y rojas) y refleja la verde, dando color a la vegetación.',
    badge: 'Biólogo Celular 🌱',
  },
  {
    id: 'q_foto_3',
    topicId: 'fotosintesis',
    topicTitle: 'La Fotosíntesis',
    gradeLevel: '1-2',
    question: '¿A través de qué parte absorbe la planta el agua y los minerales del suelo?',
    options: [
      'Por sus raíces bajo la tierra',
      'Por las puntas de sus flores',
      'Por sus frutos maduros',
      'Por el aire de la noche',
    ],
    correctIndex: 0,
    hint: 'Son los finos filamentos subterráneos que sujetan a la planta a la tierra.',
    explanation: 'Las raíces absorben el agua y nutrientes del suelo y los transportan hacia arriba a través del tallo hasta las hojas.',
    badge: 'Amigo de las Plantas 🌿',
  },
  {
    id: 'q_foto_4',
    topicId: 'fotosintesis',
    topicTitle: 'La Fotosíntesis',
    gradeLevel: '5-6',
    question: '¿Qué ingrediente del aire absorben las hojas a través de pequeños poros llamados estomas?',
    options: [
      'Dióxido de carbono (CO2)',
      'Oxígeno puro solamente',
      'Polvo de roca mineral',
      'Vapor de gasolina',
    ],
    correctIndex: 0,
    hint: 'Es el gas que nosotros exhalamos al respirar.',
    explanation: 'Las plantas absorben el dióxido de carbono ambiental, ayudando a limpiar la atmósfera y transformándolo en carbono orgánico para crecer.',
    badge: 'Científico de la Biosfera 🌍',
  },

  // ==========================================
  // 4. ESTRUCTURA DE LA TIERRA Y VOLCANES
  // ==========================================
  {
    id: 'q_volcan_1',
    topicId: 'volcan-tierra',
    topicTitle: 'Volcanes y la Tierra',
    gradeLevel: '5-6',
    question: '¿Cómo se llama la capa rocosa exterior y más delgada de la Tierra sobre la que vivimos?',
    options: [
      'La Corteza Terrestre',
      'El Núcleo Interno',
      'El Manto Inferior',
      'La Capa de Ozono',
    ],
    correctIndex: 0,
    hint: 'Es comparable al grosor de la cáscara de una manzana respecto a toda la fruta.',
    explanation: 'La corteza terrestre tiene entre 5 y 70 km de espesor; es sólida, fría y sobre ella se apoyan los continentes y los fondos marinos.',
    badge: 'Geólogo de Corteza 🪨',
  },
  {
    id: 'q_volcan_2',
    topicId: 'volcan-tierra',
    topicTitle: 'Volcanes y la Tierra',
    gradeLevel: '3-4',
    question: '¿Cuál es la diferencia entre el magma y la lava de un volcán?',
    options: [
      'El magma está dentro de la Tierra; cuando sale al exterior se llama lava',
      'El magma es frío y la lava es caliente',
      'El magma es agua y la lava es roca seca',
      'Son sustancias químicas que no tienen relación',
    ],
    correctIndex: 0,
    hint: 'Uno está atrapado bajo presión en la cámara subterránea y el otro fluye por las laderas al aire libre.',
    explanation: 'Magma es la roca derretida con gases disueltos bajo la superficie. Al abrirse paso por el cráter, pierde gases y pasa a llamarse lava.',
    badge: 'Vulcanólogo Audaz 🌋',
  },
  {
    id: 'q_volcan_3',
    topicId: 'volcan-tierra',
    topicTitle: 'Volcanes y la Tierra',
    gradeLevel: '5-6',
    question: '¿Qué se encuentra en el centro más profundo de nuestro planeta?',
    options: [
      'El Núcleo, compuesto de hierro y níquel a miles de grados',
      'Un océano gigante de agua fría y oscura',
      'Un hueco vacío con aire fresco',
      'Un bosque subterráneo de cristales',
    ],
    correctIndex: 0,
    hint: 'Allí las presiones y temperaturas son comparables a la superficie del Sol.',
    explanation: 'El núcleo de la Tierra tiene una parte externa líquida y una interna sólida, ambas compuestas de metales pesados como hierro y níquel a más de 5000°C.',
    badge: 'Explorador del Núcleo ⛏️',
  },

  // ==========================================
  // 5. MAGNETISMO Y FUERZAS INVISIBLES
  // ==========================================
  {
    id: 'q_mag_1',
    topicId: 'magnetismo',
    topicTitle: 'Magnetismo y Fuerzas',
    gradeLevel: '3-4',
    question: '¿Qué ocurre cuando intentas juntar dos polos iguales de dos imanes (por ejemplo Norte con Norte)?',
    options: [
      'Se repelen y se empujan fuertemente hacia afuera',
      'Se atraen con tanta fuerza que se funden',
      'Desaparecen de tus manos',
      'Empiezan a sonar música clásica',
    ],
    correctIndex: 0,
    hint: 'La regla de oro del magnetismo: "Polos iguales se..., polos opuestos se..."',
    explanation: 'Los polos magnéticos iguales (Norte-Norte o Sur-Sur) generan líneas de fuerza que se rechazan, creando una fuerza de repulsión palpable en las manos.',
    badge: 'Maestro de Polos 🧲',
  },
  {
    id: 'q_mag_2',
    topicId: 'magnetismo',
    topicTitle: 'Magnetismo y Fuerzas',
    gradeLevel: '3-4',
    question: '¿Por qué la aguja de una brújula apunta siempre hacia el Norte terrestre?',
    options: [
      'Porque la Tierra actúa como un imán gigantesco con su propio campo magnético',
      'Porque el viento polar la empuja físicamente',
      'Porque la aguja tiene una pequeña batería eléctrica adentro',
      'Porque el frío polar la atrae mágicamente',
    ],
    correctIndex: 0,
    hint: 'El núcleo metálico en movimiento de la Tierra crea un escudo magnético que envuelve todo el globo.',
    explanation: 'La Tierra es un gran imán natural. La pequeña aguja imantada de la brújula se alinea libremente con las líneas del campo magnético terrestre hacia los polos.',
    badge: 'Navegante de Brújula 🧭',
  },
  {
    id: 'q_mag_3',
    topicId: 'magnetismo',
    topicTitle: 'Magnetismo y Fuerzas',
    gradeLevel: '1-2',
    question: '¿Cuál de estos materiales es atraído por un imán común?',
    options: [
      'Un clip de metal hecho de hierro o acero',
      'Un trozo de madera seca de árbol',
      'Una regla de plástico escolar',
      'Un borrador de goma suave',
    ],
    correctIndex: 0,
    hint: 'Los imanes atraen metales ferromagnéticos como el hierro, el cobalto y el níquel.',
    explanation: 'El hierro y el acero tienen átomos que responden a las fuerzas magnéticas. El plástico, la madera y el caucho no son ferromagnéticos.',
    badge: 'Detector de Metales 🔍',
  },

  // ==========================================
  // 6. MÁQUINAS SIMPLES Y PALANCAS
  // ==========================================
  {
    id: 'q_maq_1',
    topicId: 'maquinas-simples',
    topicTitle: 'Máquinas Simples',
    gradeLevel: '3-4',
    question: '¿Qué truco permite levantar una caja pesada usando una palanca aplicando muy poca fuerza?',
    options: [
      'Colocar el punto de apoyo (fulcro) lo más cerca posible de la carga pesada',
      'Pintar la palanca con colores brillantes',
      'Alejar el punto de apoyo lo más lejos posible de la carga',
      'Subirse encima de la caja para pesar más',
    ],
    correctIndex: 0,
    hint: 'Cuanto más largo sea el lado donde empujas tú, mayor será la ventaja mecánica que obtienes.',
    explanation: 'Al situar el fulcro cerca de la carga pesada, el brazo de potencia es mucho más largo que el de resistencia, multiplicando la fuerza aplicada.',
    badge: 'Ingeniero Mecánico ⚙️',
  },
  {
    id: 'q_maq_2',
    topicId: 'maquinas-simples',
    topicTitle: 'Máquinas Simples',
    gradeLevel: '1-2',
    question: '¿Cuál de estos juegos del parque infantil funciona exactamente como una palanca?',
    options: [
      'El sube y baja (o balancín)',
      'El tobogán resbaladizo',
      'La caja de arena',
      'La piscina de pelotas',
    ],
    correctIndex: 0,
    hint: 'Tiene una barra larga apoyada en el medio donde dos niños se balancean subiendo y bajando.',
    explanation: 'El sube y baja es una palanca de primer género: el soporte central es el fulcro y los niños en los extremos son las fuerzas que equilibran la barra.',
    badge: 'Físico del Parque 🛝',
  },
  {
    id: 'q_maq_3',
    topicId: 'maquinas-simples',
    topicTitle: 'Máquinas Simples',
    gradeLevel: '5-6',
    question: 'Si una carga pesa 100 kg y la colocamos en una palanca con ventaja mecánica de 4 a 1, ¿cuánta fuerza necesitamos para levantarla?',
    options: [
      'El equivalente a solo 25 kg (una cuarta parte del peso)',
      'El equivalente a 400 kg',
      'Cero fuerza (levita sola)',
      'Exactamente los mismos 100 kg sin ventaja',
    ],
    correctIndex: 0,
    hint: 'La palanca divide la fuerza necesaria entre la ventaja mecánica.',
    explanation: 'La ley de la palanca (F1 × d1 = F2 × d2) demuestra que al cuadruplicar la distancia, la fuerza requerida se reduce a la cuarta parte (100 / 4 = 25 kg).',
    badge: 'Arquímedes Escolar 📐',
  },

  // ==========================================
  // 7. ARCOÍRIS Y REFRACCIÓN DE LA LUZ
  // ==========================================
  {
    id: 'q_arco_1',
    topicId: 'arcoiris',
    topicTitle: 'El Arcoíris y la Luz',
    gradeLevel: '1-2',
    question: '¿De qué color es la luz que emite el Sol antes de atravesar las gotas de lluvia?',
    options: [
      'Luz blanca (que contiene todos los colores del arcoíris combinados)',
      'Luz puramente verde como las hojas',
      'Luz negra y sombría',
      'Luz roja de bengala',
    ],
    correctIndex: 0,
    hint: 'La luz diurna parece transparente o blanca, pero en su interior viajan los 7 colores juntos.',
    explanation: 'La luz blanca visible está formada por todas las longitudes de onda del espectro. Cuando viajan juntas, nuestro ojo las percibe blancas.',
    badge: 'Científico de la Luz 🌈',
  },
  {
    id: 'q_arco_2',
    topicId: 'arcoiris',
    topicTitle: 'El Arcoíris y la Luz',
    gradeLevel: '3-4',
    question: '¿Qué fenómeno físico ocurre cuando un rayo de luz entra en una gota de agua y se desvía separándose en colores?',
    options: [
      'Refracción y dispersión de la luz',
      'Congelación instantánea',
      'Evaporación instantánea del rayo',
      'Combustión con fuego',
    ],
    correctIndex: 0,
    hint: 'La luz viaja a menor velocidad en el agua que en el aire, lo que curva su trayectoria.',
    explanation: 'Al cambiar de medio (del aire al agua de la gota), cada color viaja a diferente velocidad y se refracta con un ángulo distinto, desplegando los colores.',
    badge: 'Óptico Curioso 💎',
  },
  {
    id: 'q_arco_3',
    topicId: 'arcoiris',
    topicTitle: 'El Arcoíris y la Luz',
    gradeLevel: '3-4',
    question: '¿Dónde debe estar el Sol para que podamos ver un arcoíris en el cielo?',
    options: [
      'A nuestras espaldas, iluminando la lluvia que tenemos enfrente',
      'Directamente tapado bajo nuestros pies',
      'No hace falta que haya Sol, solo noche oscura',
      'En medio de la nube de lluvia',
    ],
    correctIndex: 0,
    hint: 'La luz debe entrar a las gotas frente a ti y rebotar hacia tus ojos.',
    explanation: 'Para ver un arcoíris, el observador debe encontrarse entre el Sol (a su espalda) y las gotas de lluvia suspendidas enfrente.',
    badge: 'Cazador de Arcoíris 🌦️',
  },

  // ==========================================
  // 8. FLOTABILIDAD Y DENSIDAD (ARQUÍMEDES)
  // ==========================================
  {
    id: 'q_flot_1',
    topicId: 'flotabilidad',
    topicTitle: 'Flotabilidad y Barcos',
    gradeLevel: '3-4',
    question: '¿Por qué un barco gigante de acero puede flotar en el mar mientras que una pequeña moneda de metal se hunde?',
    options: [
      'Porque el barco tiene forma hueca llena de aire, lo que hace que su densidad media sea menor que la del agua',
      'Porque el barco tiene hélices que lo empujan hacia arriba',
      'Porque el agua del mar rechaza objetos pequeños',
      'Porque el acero flota naturalmente en cualquier condición',
    ],
    correctIndex: 0,
    hint: 'El aire dentro del casco es muy liviano y ocupa un gran volumen.',
    explanation: 'Aunque el acero es denso, el gran volumen de aire atrapado dentro del casco hace que la densidad total del barco sea inferior a 1 g/cm³, flotando por el empuje hidrostático.',
    badge: 'Almirante de la Flotabilidad ⛵',
  },
  {
    id: 'q_flot_2',
    topicId: 'flotabilidad',
    topicTitle: 'Flotabilidad y Barcos',
    gradeLevel: '5-6',
    question: '¿Qué descubrió el sabio Arquímedes sobre el empuje que el agua ejerce sobre un cuerpo sumergido?',
    options: [
      'Que el empuje hacia arriba es igual al peso del agua desalojada por el objeto',
      'Que el agua siempre empuja hacia abajo con fuerza de imán',
      'Que los objetos pesan el doble dentro del agua',
      'Que el agua no ejerce ninguna fuerza',
    ],
    correctIndex: 0,
    hint: '¡Eureka! El volumen sumergido empuja hacia los lados una cantidad exacta de líquido.',
    explanation: 'El Principio de Arquímedes establece que todo cuerpo sumergido experimenta un empuje vertical hacia arriba igual al peso del fluido desplazado.',
    badge: 'Heredero de Arquímedes 👑',
  },
  {
    id: 'q_flot_3',
    topicId: 'flotabilidad',
    topicTitle: 'Flotabilidad y Barcos',
    gradeLevel: '1-2',
    question: '¿Por qué un salvavidas de goma inflado con aire no se hunde en la piscina aunque un niño se apoye en él?',
    options: [
      'Porque el aire en su interior es muy ligero y menos denso que el agua',
      'Porque está pegado con pegamento al borde de la piscina',
      'Porque el plástico tiene alas invisibles',
      'Porque la piscina está hecha de gelatina',
    ],
    correctIndex: 0,
    hint: 'El aire pesa mucho menos que el agua del mismo tamaño.',
    explanation: 'El salvavidas lleno de aire ocupa mucho espacio pero pesa muy poco. La fuerza del agua empuja ese gran volumen hacia arriba con firmeza.',
    badge: 'Capitán Salvavidas 🛟',
  },
];

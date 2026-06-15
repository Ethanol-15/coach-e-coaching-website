import client1After from "../assets/client-media/client-1-after.png";
import client1Before from "../assets/client-media/client-1-before.png";

import client2After from "../assets/client-media/client-2-after.png";
import client2Before from "../assets/client-media/client-2-before.png";

import client3After from "../assets/client-media/client-3-after.png";
import client3Before from "../assets/client-media/client-3-before.png";

const clientsData = [
  {
    id: 1,
    label: "Client 01",
    goal: "Goal: Fat loss and muscle retention",
    quote:
      "The structured plan made all the difference. I never felt lost in the gym again.",
    result: "Successful body recomposition",
    icon: "ti ti-trending-down",
    beforeImage: client1Before,
    afterImage: client1After,
  },
  {
    id: 2,
    label: "Client 02",
    goal: "Goal: Fat loss & Body Recomposition",
    quote:
      "I finally broke through my training plateau. The programming was simple, clear, and effective.",
    result: " Lost 8 kg in 12 week",
    icon: "ti ti-barbell",
    beforeImage: client2Before,
    afterImage: client2After,
  },
  {
    id: 3,
    label: "Client 03",
    goal: "Goal: Strength and muscle growth",
    quote:
      "I became leaner while building more muscle and improving my training performance.",
    result: "Improved overall strength",
    icon: "ti ti-flame",
    beforeImage: client3Before,
    afterImage: client3After,
  },
];

export default clientsData;
export type Story = {
  id: string;
  title: string;
  pages: Array<{
    index: number;
    imageUrl: string;
    text: string;
  }>;
};

export const mockStories: Story[] = [
  {
    id: "mock-sunrise-1",
    title: "Luna and the Sunrise Kite",
    pages: [
      {
        index: 1,
        imageUrl: "https://picsum.photos/seed/luna-kite-1/1200/800",
        text: "Luna woke up early and ran to the hill with her bright orange kite.",
      },
      {
        index: 2,
        imageUrl: "https://picsum.photos/seed/luna-kite-2/1200/800",
        text: "The wind danced, and her kite painted a rainbow line in the sky.",
      },
      {
        index: 3,
        imageUrl: "https://picsum.photos/seed/luna-kite-3/1200/800",
        text: "She smiled and whispered, 'Today is a brave and happy day.'",
      },
    ],
  },
  {
    id: "mock-forest-2",
    title: "Milo in the Whispering Forest",
    pages: [
      {
        index: 1,
        imageUrl: "https://picsum.photos/seed/milo-forest-1/1200/800",
        text: "Milo followed tiny glowing footprints between the trees.",
      },
      {
        index: 2,
        imageUrl: "https://picsum.photos/seed/milo-forest-2/1200/800",
        text: "A friendly owl showed him a map made of leaves and stars.",
      },
      {
        index: 3,
        imageUrl: "https://picsum.photos/seed/milo-forest-3/1200/800",
        text: "At sunset, Milo found the path home and thanked the forest.",
      },
    ],
  },
];


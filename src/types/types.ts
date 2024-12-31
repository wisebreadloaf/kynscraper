export interface Posts {
  userName: string;
  userId: string;
  profilePicture: string;
  verified: boolean;
  post: {
    postId: string;
    description: string;
    postedTime: string;
    likes: number;
    views: number;
    location: string;
    image: string;
  };
}

export interface Videos {
  userName: string;
  userId: string;
  profilePicture: string;
  verified: boolean;
  video: {
    postId: string;
    title: string;
    description: string;
    thumbnailLink: string;
    postedTime: string;
    likes: number;
    views: number;
    location: string;
    videoLink: string[];
  };
}

export interface Klips {
  userName: string;
  userId: string;
  profilePicture: string;
  verified: boolean;
  klip: {
    postId: string;
    title: string;
    description: string;
    postedTime: string;
    likes: number;
    location: string;
    videoLink: string[];
  };
}

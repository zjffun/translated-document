type Props = {
  content: string;
};

const PostBody = ({ content }: Props) => {
  return (
    <div className="Layout" dangerouslySetInnerHTML={{ __html: content }} />
  );
};

export default PostBody;

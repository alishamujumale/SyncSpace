import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btn = (action, label, active) => (
    <button
      onClick={action}
      style={{
        ...styles.menuBtn,
        backgroundColor: active ? '#37352f' : 'transparent',
        color: active ? 'white' : '#37352f'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.menuBar}>
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleUnderline().run(), 'U', editor.isActive('underline'))}
      {btn(() => editor.chain().focus().toggleHighlight().run(), 'H', editor.isActive('highlight'))}
      <div style={styles.divider} />
      {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', editor.isActive('heading', { level: 1 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      <div style={styles.divider} />
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleCodeBlock().run(), '</>',editor.isActive('codeBlock'))}
      <div style={styles.divider} />
      {btn(() => editor.chain().focus().setTextAlign('left').run(), '⬅', editor.isActive({ textAlign: 'left' }))}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), '↔', editor.isActive({ textAlign: 'center' }))}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), '➡', editor.isActive({ textAlign: 'right' }))}
    </div>
  );
};

const RichEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing...' })
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML())
  });

  return (
    <div style={styles.wrapper}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} style={styles.editor} />
    </div>
  );
};

const styles = {
  wrapper: {
    border: '1px solid #e8e8e6',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
    minHeight: '500px'
  },
  menuBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
    padding: '8px',
    borderBottom: '1px solid #e8e8e6',
    backgroundColor: '#fafafa'
  },
  menuBtn: {
    border: '1px solid transparent',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.1s'
  },
  divider: {
    width: '1px',
    backgroundColor: '#e8e8e6',
    margin: '0 4px'
  },
  editor: {
    padding: '20px',
    minHeight: '460px',
    fontSize: '15px',
    lineHeight: '1.8'
  }
};

export default RichEditor;
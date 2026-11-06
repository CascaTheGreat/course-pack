/**
 * XML parsing utilities for IMSCC and Canvas descriptors.
 * Uses native DOMParser in the browser, with a lightweight fallback in Node/testing.
 */

export interface XmlNodeLike {
  tagName: string
  localName: string
  textContent: string
  children: XmlNodeLike[]
  getAttribute(name: string): string | null
  getElementsByTagName(name: string): XmlNodeLike[]
}

class SimpleXmlNode implements XmlNodeLike {
  tagName: string = ""
  localName: string = ""
  attributes: Record<string, string> = {}
  children: XmlNodeLike[] = []
  textContent: string = ""

  getAttribute(name: string): string | null {
    const lower = name.toLowerCase()
    for (const [key, val] of Object.entries(this.attributes)) {
      if (key.toLowerCase() === lower) return val
    }
    return null
  }

  getElementsByTagName(name: string): XmlNodeLike[] {
    const result: XmlNodeLike[] = []
    const target = name.toLowerCase()

    const traverse = (node: XmlNodeLike) => {
      for (const ch of node.children) {
        if (
          target === "*" ||
          ch.localName.toLowerCase() === target ||
          ch.tagName.toLowerCase() === target
        ) {
          result.push(ch)
        }
        traverse(ch)
      }
    }

    traverse(this)
    return result
  }
}

/**
 * Lightweight XML string parser fallback for Node.js / non-browser environments
 */
function parseXmlFallback(xmlText: string): XmlNodeLike {
  const root = new SimpleXmlNode()
  root.tagName = "#document"
  root.localName = "#document"

  const stack: SimpleXmlNode[] = [root]
  // Regex to match XML tags and text content
  const tagRegex = /<([?!/]?)([\w:.-]+)([^>]*)>|([^<]+)/g
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(xmlText)) !== null) {
    const [, modifier, fullTagName, attrString, textContent] = match

    if (textContent) {
      const current = stack[stack.length - 1]
      if (current && current !== root) {
        current.textContent += textContent
      }
      continue
    }

    if (!fullTagName) continue

    // Skip <?xml ...?> or comments <!-- ... --> or <!DOCTYPE ...>
    if (modifier === "?" || modifier === "!") {
      continue
    }

    if (modifier === "/") {
      // Closing tag
      if (stack.length > 1) {
        stack.pop()
      }
      continue
    }

    // Opening tag
    const node = new SimpleXmlNode()
    node.tagName = fullTagName
    const colonIdx = fullTagName.indexOf(":")
    node.localName = colonIdx !== -1 ? fullTagName.substring(colonIdx + 1) : fullTagName

    // Parse attributes
    if (attrString) {
      const attrRegex = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
      let attrMatch: RegExpExecArray | null
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const attrName = attrMatch[1]
        const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? ""
        if (attrName) {
          node.attributes[attrName] = attrVal
        }
      }
    }

    const current = stack[stack.length - 1]
    if (current) {
      current.children.push(node)
    }

    // Self-closing tag?
    const isSelfClosing = Boolean(attrString && attrString.trim().endsWith("/"))
    if (!isSelfClosing) {
      stack.push(node)
    }
  }

  return root
}

export function parseXml(xmlText: string): Document | XmlNodeLike {
  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    try {
      const parser = new window.DOMParser()
      return parser.parseFromString(xmlText, "text/xml")
    } catch {
      // Fallback
    }
  }

  // Node.js fallback
  return parseXmlFallback(xmlText)
}

export function decodeHtmlEntities(encodedString: string): string {
  if (!encodedString) return ""
  return encodedString
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

export function getDirectChildren(parent: any, localName: string): any[] {
  if (!parent) return []
  const result: any[] = []
  const children = parent.children || []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child && (child.localName === localName || child.tagName?.toLowerCase() === localName.toLowerCase())) {
      result.push(child)
    }
  }
  return result
}

export function findElementsByLocalName(root: any, localName: string): any[] {
  if (!root) return []
  const result: any[] = []
  const all = root.getElementsByTagName ? root.getElementsByTagName("*") : []
  const target = localName.toLowerCase()
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    if (
      el &&
      (el.localName?.toLowerCase() === target ||
        el.tagName?.toLowerCase().endsWith(":" + target) ||
        el.tagName?.toLowerCase() === target)
    ) {
      result.push(el)
    }
  }
  return result
}

export function findFirstByLocalName(root: any, localName: string): any | null {
  if (!root) return null
  const elements = findElementsByLocalName(root, localName)
  return elements.length > 0 && elements[0] ? elements[0] : null
}

export function getTextByLocalName(root: any, localName: string): string {
  const el = findFirstByLocalName(root, localName)
  return el?.textContent?.trim() || ""
}

export function getAttrByLocalName(root: any, localName: string, attr: string): string {
  const el = findFirstByLocalName(root, localName)
  return el?.getAttribute ? el.getAttribute(attr)?.trim() || "" : ""
}

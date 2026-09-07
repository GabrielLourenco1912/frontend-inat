function isBrowserExtensionMarker(attributeName: string) {
  return (
    attributeName === "bis_skin_checked" ||
    attributeName === "bis_register" ||
    (attributeName.startsWith("__processed_") && attributeName.endsWith("__"))
  );
}

function removeBrowserExtensionMarkers() {
  for (const element of document.querySelectorAll("*")) {
    for (const attribute of Array.from(element.attributes)) {
      if (isBrowserExtensionMarker(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

// Some security extensions mutate the SSR document before React starts. In
// development, remove only their bookkeeping attributes so hydration still
// reports genuine application mismatches.
if (process.env.NODE_ENV === "development") {
  try {
    removeBrowserExtensionMarkers();
  } catch {
    // Client instrumentation must never prevent the application from starting.
  }
}

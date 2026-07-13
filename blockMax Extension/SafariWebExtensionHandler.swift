//
//  SafariWebExtensionHandler.swift
//  blockMax Extension
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private static let messagesKey = "blockedMessages"
    private static let defaultMessages = [
        "You've got this. Come back later.",
        "Stay focused. This can wait.",
        "Deep work mode. You're doing great."
    ]

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        let responsePayload: Any

        if let msg = message as? [String: Any], msg["request"] as? String == "getMessages" {
            // Read from the main app's UserDefaults via the shared bundle-ID suite name
            let defaults = UserDefaults(suiteName: "tobias.jermain.blockMax") ?? .standard
            let messages = defaults.stringArray(forKey: Self.messagesKey) ?? Self.defaultMessages
            responsePayload = ["messages": messages]
        } else {
            os_log(.default, "Received message: %@", String(describing: message))
            responsePayload = ["echo": message as Any]
        }

        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: responsePayload]
        } else {
            response.userInfo = ["message": responsePayload]
        }

        context.completeRequest(returningItems: [response], completionHandler: nil)
    }

}

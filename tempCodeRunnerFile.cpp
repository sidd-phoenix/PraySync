#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_set>

using namespace std;

// Function to check if any string in the selected list is a substring of the current string
bool isValid(const string& str, const unordered_set<string>& selected) {
    for (const auto& s : selected) {
        if (s.find(str) != string::npos) {
            return false; // str is a substring of s
        }
    }
    return true;
}

// Function to find the largest subset where no string is a substring of another
int largestSubsetSize(const vector<string>& strings) {
    int n = strings.size();
    unordered_set<string> selected; // Set to store selected strings

    // Sort the strings by length in descending order
    vector<string> sortedStrings = strings;
    sort(sortedStrings.begin(), sortedStrings.end(), [](const string& a, const string& b) {
        return a.length() > b.length();
    });

    // Greedy selection of strings
    for (const string& str : sortedStrings) {
        // Select the string only if it is not a substring of any previously selected string
        if (isValid(str, selected)) {
            selected.insert(str);
        }
    }

    return selected.size(); // Return the size of the selected subset
}

int main() {
    int n;
    cin >> n; // Read the number of strings

    vector<string> strings(n);
    
    // Read the strings
    for (int i = 0; i < n; ++i) {
        cin >> strings[i];
    }

    // Output the largest subset size
    cout << largestSubsetSize(strings) << endl;

    return 0;
}